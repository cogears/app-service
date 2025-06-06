import { DataSchemaInfo } from "./decorate.js";
import { criteriaBuilder, CriteriaCondition, predicates } from "./Helper.js";
import { EntitySubject, Repository as IRepository, PageRequest, RepeatSql, Repository, Specification, } from "./index.js";
import * as Methods from "./Methods.js";
import { StorageConnection, StorageRepository, StorageRepositoryFactory } from './options.js';

function flatten(array: Array<any>): Array<any> {
    let newArray = [].concat(...array);
    return newArray.length === array.length ? newArray : flatten(newArray);
}

interface ProxyObject {
    proxy: Object;
    revoke(): void;
}

/** @internal */
export default class RepositoryFactory {
    private readonly driverRepositoryFactory: StorageRepositoryFactory;
    private readonly storage: string

    constructor(storage: string, driverRepositoryFactory: StorageRepositoryFactory) {
        this.storage = storage
        this.driverRepositoryFactory = driverRepositoryFactory;
    }

    async register<T>(connection: StorageConnection, schema: DataSchemaInfo<T>): Promise<void> {
        let storage: StorageRepository<T> = await this.driverRepositoryFactory.createRepository(connection, schema)
        if (!schema.repositoryClass) {
            schema.repositoryClass = createDynamicRepository()
        }
        this.buildBase(storage, schema);
        this.buildMethods(storage, schema);
    }

    private buildBase<T>(storage: StorageRepository<T>, schema: DataSchemaInfo<T>): void {
        const self = this;
        schema.repositoryClass.prototype.getSchema = function () {
            return schema;
        };

        schema.repositoryClass.prototype.insert = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection(self.storage);
            return await storage.insert(connection, entity);
        };

        schema.repositoryClass.prototype.update = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection(self.storage);
            return await storage.update(connection, entity)
        };

        schema.repositoryClass.prototype.save = async function (entity: T): Promise<T> {
            let connection = await this.context.getStorageConnection(self.storage);
            return await storage.save(connection, entity)
        };

        schema.repositoryClass.prototype.delete = async function (key: any): Promise<void> {
            let connection = await this.context.getStorageConnection(self.storage);
            let primaryKey = schema.fields[0].name;
            let where = primaryKey + '=?';
            let values = [key];
            return await storage.delete(connection, where, values);
        };

        schema.repositoryClass.prototype.clear = async function (): Promise<void> {
            let connection = await this.context.getStorageConnection(self.storage);
            return await storage.delete(connection);
        };

        schema.repositoryClass.prototype.get = async function (key: any): Promise<T | undefined> {
            let connection = await this.context.getStorageConnection(self.storage);
            let primaryKey = schema.fields[0].name;
            let where = primaryKey + '=?';
            let values = [key];
            let list = await storage.select(connection, where, undefined, values);
            return list.length > 0 ? list[0] : undefined;
        };

        schema.repositoryClass.prototype.count = async function (specification: Specification<T>): Promise<number> {
            let connection = await this.context.getStorageConnection(self.storage);
            let where = specification ? self.executeSpecification(schema, specification) : '';
            return await storage.count(connection, where, []);
        };

        schema.repositoryClass.prototype.select = async function (specification: Specification<T>, pageRequest: PageRequest): Promise<any> {
            let connection = await this.context.getStorageConnection(self.storage);
            let where = specification ? self.executeSpecification(schema, specification) : '';
            return await storage.select(connection, where, pageRequest, []);
        };

        schema.repositoryClass.prototype.generateRepeat = function () {
            return storage.generateRepeat()
        }

        schema.repositoryClass.prototype.submitRepeat = async function (repeat: RepeatSql<T>) {
            let connection = await this.context.getStorageConnection(self.storage);
            return await storage.submitRepeat(connection, repeat)
        }
    }

    private buildMethods<T>(storage: StorageRepository<T>, schema: DataSchemaInfo<T>): void {
        if (schema.methods && schema.methods.length > 0) {
            const self = this;
            for (let i = 0; i < schema.methods.length; i++) {
                let method = schema.methods[i];
                if (method.sql) {
                    schema.repositoryClass.prototype[method.name] = async function (...values: Array<any>) {
                        let connection = await this.context.getStorageConnection(self.storage);
                        let list = await connection.query(method.sql, values);
                        if (method.sql.toLowerCase().startsWith('select')) {
                            return storage.transform(list)
                        } else {
                            return list
                        }
                    }
                } else {
                    let key = Object.keys(Methods).find(key => method.name.startsWith(key));
                    if (key) {
                        let { where, argumentsLength } = this.parseQuery(schema, method.name.substring(key.length));
                        //@ts-ignore
                        schema.repositoryClass.prototype[method.name] = Methods[key](self.storage, storage, where, argumentsLength);
                    }
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
                let condition = subject[field.name][field.operator]();
                if (buf) {
                    return field.and ? criteriaBuilder.and(buf, condition) : criteriaBuilder.or(buf, condition);
                } else {
                    return condition;
                }
            }, false);
        });
        return { where, argumentsLength };
    }

    private executeSpecification<T>(schema: DataSchemaInfo<T>, specification: Specification<any>): string {
        let target: ProxyObject = this.createObject(schema);
        try {
            let buffer = specification(criteriaBuilder, target.proxy as EntitySubject<T>);
            return buffer.toString()
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
                        return new CriteriaCondition('`' + name + '`' + predicates[operator](...args))
                    }
                } else {
                    throw new Error('不支持的方法: ' + operator);
                }
            }
        })
    }
}


function createDynamicRepository<T>() {
    return class DynamicRepository extends Repository<T> implements IRepository<T> {
        insert(entity: T): Promise<T> {
            throw new Error("Method not implemented.");
        }
        update(entity: T): Promise<T> {
            throw new Error("Method not implemented.");
        }
        save(entity: T): Promise<T> {
            throw new Error("Method not implemented.");
        }
        delete(key: any): Promise<void> {
            throw new Error("Method not implemented.");
        }
        clear(): Promise<void> {
            throw new Error("Method not implemented.");
        }
        get(key: any): Promise<T | undefined> {
            throw new Error("Method not implemented.");
        }
        select(specification?: Specification<T> | undefined, pageRequest?: PageRequest): Promise<T[]> {
            throw new Error("Method not implemented.");
        }
        count(specification?: Specification<T> | undefined): Promise<number> {
            throw new Error("Method not implemented.");
        }
        generateRepeat(): RepeatSql<T> {
            throw new Error("Method not implemented.");
        }
        submitRepeat(repeat: RepeatSql<T>): Promise<void> {
            throw new Error("Method not implemented.");
        }
    }
}