import { EntitySubject, PageRequest, Specification, RepeatSql } from "types";
import { DataSchemaInfo, StorageConnection, StorageRepository, StorageRepositoryFactory } from ".";
import { criteriaBuilder, predicates, CriteriaBufferImpl } from "./Helper";
import * as Methods from "./Methods";

function flatten(array: Array<any>): Array<any> {
    let newArray = [].concat(...array);
    return newArray.length === array.length ? newArray : flatten(newArray);
}

interface ProxyObject {
    proxy: Object;

    revoke(): void;
}

export default class RepositoryFactory {
    private readonly driverRepositoryFactory: StorageRepositoryFactory;

    constructor(driverRepositoryFactory: StorageRepositoryFactory) {
        this.driverRepositoryFactory = driverRepositoryFactory;
    }

    async register<T>(connection: StorageConnection, schema: DataSchemaInfo<T>): Promise<void> {
        let storage: StorageRepository<T> = await this.driverRepositoryFactory.createRepository(connection, schema);
        this.buildBase(storage, schema);
        this.buildMethods(storage, schema);
    }

    private buildBase<T>(storage: StorageRepository<T>, schema: DataSchemaInfo<T>): void {
        const self = this;
        schema.repositoryClass.prototype.getSchema = function () {
            return schema;
        };

        schema.repositoryClass.prototype.insert = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection();
            return await storage.insert(connection, entity);
        };

        schema.repositoryClass.prototype.update = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection();
            return await storage.update(connection, entity)
        };

        schema.repositoryClass.prototype.save = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection();
            return await storage.save(connection, entity)
        };

        schema.repositoryClass.prototype.delete = async function (key: any): Promise<void> {
            let connection = await this.context.getStorageConnection();
            let primaryKey = schema.fields[0].name;
            let where = primaryKey + '=?';
            let values = [key];
            return await storage.delete(connection, where, values);
        };

        schema.repositoryClass.prototype.clear = async function (): Promise<void> {
            let connection = await this.context.getStorageConnection();
            return await storage.delete(connection);
        };

        schema.repositoryClass.prototype.get = async function (key: any): Promise<T | undefined> {
            let connection = await this.context.getStorageConnection();
            let primaryKey = schema.fields[0].name;
            let where = primaryKey + '=?';
            let values = [key];
            let list = await storage.select(connection, where, undefined, values);
            return list.length > 0 ? list[0] : undefined;
        };

        schema.repositoryClass.prototype.count = async function (specification: Specification<T>): Promise<number> {
            let connection = await this.context.getStorageConnection();
            let where = specification ? self.executeSpecification(schema, specification) : '';
            return await storage.count(connection, where, []);
        };

        schema.repositoryClass.prototype.select = async function (specification: Specification<T>, pageRequest: PageRequest): Promise<any> {
            let connection = await this.context.getStorageConnection();
            let where = specification ? self.executeSpecification(schema, specification) : '';
            return await storage.select(connection, where, pageRequest, []);
        };

        schema.repositoryClass.prototype.generateRepeat = function () {
            return storage.generateRepeat()
        }

        schema.repositoryClass.prototype.submitRepeat = async function (repeat: RepeatSql<T>) {
            let connection = await this.context.getStorageConnection();
            return await storage.submitRepeat(connection, repeat)
        }
    }

    private buildMethods<T>(storage: StorageRepository<T>, schema: DataSchemaInfo<T>): void {
        for (let i = 0; i < schema.methods.length; i++) {
            let method = schema.methods[i];
            if (method.sql) {
                schema.repositoryClass.prototype[method.name] = async function (...values: Array<any>) {
                    let connection = await this.context.getStorageConnection();
                    return connection.query(method.sql, values);
                }
            } else {
                let key = Object.keys(Methods).find(key => method.name.startsWith(key));
                if (key) {
                    let { where, argumentsLength } = this.parseQuery(schema, method.name.substring(key.length));
                    //@ts-ignore
                    schema.repositoryClass.prototype[method.name] = Methods[key](storage, where, argumentsLength);
                }
            }
        }
    }

    private parseQuery(schema: DataSchemaInfo<any>, query: string) {
        let fields = flatten(query.split('And').map(f => {
            if (f.indexOf('Or') === -1) {
                return { name: f, and: true };
            } else {
                return f.split('Or').map(f0 => {
                    return { name: f0 };
                });
            }
        }));
        let argumentsLength = 0;
        let foundAll = fields.every(f => {
            Object.keys(predicates).some((key: string) => {
                //@ts-ignore
                let operator = predicates[key];
                if (f.name.endsWith(operator.name)) {
                    f.operator = key;
                    f.length = operator.length;
                    f.name = f.name[0].toLowerCase() + f.name.substr(1, f.name.length - operator.name.length - 1);
                    return true;
                }
                return false;
            });
            if (!f.operator) {
                f.operator = 'equal';
                f.length = 1;
                f.name = f.name[0].toLowerCase() + f.name.substr(1);
            }
            argumentsLength += f.length;
            return schema.fields.some(item => item.alias == f.name);
        });
        if (!foundAll) {
            throw new Error(`无法在${schema.name}存储上查询${query}，请检查字段是否匹配`);
        }
        let where = this.executeSpecification(schema, function (criteriaBuilder, subject) {
            return fields.reduce((buf, field) => {
                //@ts-ignore
                let condition = subject[field.alias][field.operator]();
                if (buf) {
                    return field.and ? criteriaBuilder.and(buf, condition) : criteriaBuilder.or(buf, condition);
                } else {
                    return condition;
                }
            }, false);
        });
        return { where, argumentsLength };
    }

    private executeSpecification<T>(schema: DataSchemaInfo<T>, specification: Specification<any>) {
        let target: ProxyObject = this.createObject(schema);
        try {
            return specification(criteriaBuilder, target.proxy as EntitySubject<T>);
        } finally {
            target.revoke();
        }
    }

    private createObject<T>(schema: DataSchemaInfo<T>): ProxyObject {
        let fields: { [index: string]: ProxyObject } = {};
        let proxyObject: ProxyObject = Proxy.revocable({}, {
            get: (_, name: string) => {
                if (!fields[name]) {
                    let define = schema.fields.find(item => item.alias == name)
                    if (define) {
                        fields[name] = this.createField(define.name);
                    } else {
                        throw new Error(`找不到${schema.name}.${name}`);
                    }
                }
                return fields[name].proxy;
            }
        });
        return {
            proxy: proxyObject.proxy,
            revoke: function () {
                proxyObject.revoke();
                Object.values(fields).forEach(field => field.revoke());
            }
        }
    }

    private createField(name: string): ProxyObject {
        return Proxy.revocable({}, {
            get: (_, operator: string) => {
                if (Reflect.has(predicates, operator)) {
                    return (...args: Array<any>) => {
                        args = args.map(arg => this.driverRepositoryFactory.encode(arg));
                        //@ts-ignore
                        return new CriteriaBufferImpl('`' + name + '`' + predicates[operator](...args))
                    }
                } else {
                    throw new Error('不支持的方法: ' + operator);
                }
            }
        })
    }
}
