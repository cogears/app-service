import { Class } from "../lang.js";
import { Repository } from "./index.js";

///////////////////////////////////////////////////////////////////////////////
////  数据实体定义                                                           ////
///////////////////////////////////////////////////////////////////////////////
export type DataSchema<T> = {
    name: string,
    fields: DataField[],
    entityClass?: Class<T>,
} & DataSchemaOptions

export type DataSchemaOptions = {
    name?: string,
    writable?: boolean,
    comment?: string,
    storage?: string,
}

export type DataField = { name: string, alias: string, } & DataFieldOptions;
export type DataFieldOptions = {
    type: DataFieldType,
    name?: string,
    auto?: boolean,         // 自增/当前时间
    update?: boolean,       // 更新时间
    len?: number,
    m?: number,
    d?: number,
    comment?: string,
    canBeNull?: boolean,    // 是否可为空
}

export type DataFieldType = "int" | "bigint" | "boolean" | "string" | "text" | "datetime" | "decimal" | "double";

///////////////////////////////////////////////////////////////////////////////
////  修饰器                                                                ////
///////////////////////////////////////////////////////////////////////////////
export const storage = {
    entity(options?: DataSchemaOptions) {
        return function (entityClass: Class<any>) {
            if (options) {
                registerEntity(entityClass, options)
            }
        }
    },
    id(options: DataFieldOptions) {
        return function (prototype: any, propertyName: string) {
            registerField(prototype.constructor, propertyName, options, true);
        }
    },
    column(options: DataFieldOptions) {
        return function (prototype: any, propertyName: string) {
            registerField(prototype.constructor, propertyName, options);
        }
    },
    repository(entityClass: Class<any>) {
        return function (repositoryClass: Class<any>) {
            binding.set(entityClass, repositoryClass)
        }
    },
    sql(sql?: string) {
        return function (prototype: any, methodName: string, descriptor: PropertyDescriptor) {
            registerMethod(prototype.constructor, methodName, sql);
        }
    },
}


interface EntityInfo {
    clazz: Class<any>;
    name: string;
    writable: boolean;
    fields: DataField[];
    comment?: string;
    storage?: string;
}

interface RepositoryInfo {
    clazz: Class<any>;
    methods: DataMethod[];
}

interface DataMethod {
    name: string;
    sql: string;
}

/** @internal */
export interface DataSchemaInfo<T> extends DataSchema<T> {
    repositoryClass: Class<Repository<T>>;
    methods?: DataMethod[];
}

const binding: Map<any, any> = new Map();
const entities: Map<any, EntityInfo> = new Map();
const repositories: Map<any, RepositoryInfo> = new Map();

function registerEntity(entityClass: Class<any>, options: DataSchemaOptions) {
    let info = entities.get(entityClass);
    if (!info) {
        info = { clazz: entityClass, name: entityClass.name, writable: false, fields: [] };
        entities.set(entityClass, info);
    }
    Object.assign(info, options)
}

function registerField(entityClass: Class<any>, alias: string, options: DataFieldOptions, isPrimaryKey: boolean = false) {
    let info = entities.get(entityClass);
    if (!info) {
        info = { clazz: entityClass, name: entityClass.name, writable: false, fields: [] };
        entities.set(entityClass, info);
    }
    let field: DataField = Object.assign({ alias, name: alias }, options);
    if (isPrimaryKey) {
        info.fields.unshift(field);
    } else {
        info.fields.push(field);
    }
}

function registerMethod(repositoryClass: Class<any>, name: string, sql: string = '') {
    let info = repositories.get(repositoryClass);
    if (!info) {
        info = { clazz: repositoryClass, methods: [] };
        repositories.set(repositoryClass, info);
    }
    info.methods.push({ name, sql });
}

/** @internal */
export function getSchemas(): DataSchemaInfo<any>[] {
    let schemas: DataSchemaInfo<any>[] = [];
    for (let [entityClass, repositoryClass] of binding.entries()) {
        let entity = entities.get(entityClass);
        if (entity) {
            let info: DataSchemaInfo<any> = {
                name: entity.name,
                writable: entity.writable,
                comment: entity.comment,
                storage: entity.storage || '',
                fields: entity.fields,
                entityClass: entityClass,
                repositoryClass: repositoryClass,
                methods: []
            };
            let repository = repositories.get(repositoryClass);
            if (repository) {
                info.methods = repository.methods;
            }
            schemas.push(info);
        }
    }
    return schemas;
}
