import TaskContext from "../core/task/TaskContext.js";

///////////////////////////////////////////////////////////////////////////////
////  数据实体定义                                                           ////
///////////////////////////////////////////////////////////////////////////////
export type MysqlConfig = {
    name: string;
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number,
    queueLimit?: number,
}

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

export type DataFieldType = "int" | "bigint" | "string" | "boolean" | "text" | "timestamp" | "date" | "datetime" | "decimal" | "double";

///////////////////////////////////////////////////////////////////////////////
////  应用接口                                                              ////
///////////////////////////////////////////////////////////////////////////////
export interface Storage {
    createRepository<T>(schema: DataSchema<T>): Promise<void>
    getRepository<T>(target: string | Class<T>): Repository<T>
}

export abstract class Repository<T> {
    private context: TaskContext;

    constructor(context: TaskContext) {
        this.context = context;
    }

    abstract insert(entity: T): Promise<T>;

    abstract update(entity: T): Promise<T>;

    abstract save(entity: T): Promise<T>;

    abstract delete(key: any): Promise<void>;

    abstract clear(): Promise<void>;

    abstract get(key: any): Promise<T | undefined>;

    abstract select(specification?: Specification<T>, pageRequest?: PageRequest): Promise<T[]>;

    abstract count(specification?: Specification<T>): Promise<number>;

    abstract generateRepeat(): RepeatSql<T>;
    abstract submitRepeat(repeat: RepeatSql<T>): Promise<void>;
}

export interface Specification<T> {
    (criteriaBuilder: CriteriaBuilder, subject: EntitySubject<T>): CriteriaBuffer;
}

export interface CriteriaBuilder {
    blank(): CriteriaBuffer;

    and(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;

    or(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;
}

export type EntitySubject<T> = {
    [index in keyof T]: EntityFieldPredicate;
}

export interface EntityFieldPredicate {
    equal(value: any): CriteriaBuffer;

    between(min: any, max: any): CriteriaBuffer;

    lessThan(value: any, equal?: boolean): CriteriaBuffer;

    greaterThan(value: any, equal?: boolean): CriteriaBuffer;

    isNull(): CriteriaBuffer;

    isNotNull(): CriteriaBuffer;

    notNull(): CriteriaBuffer;

    like(value: any): CriteriaBuffer;

    notLike(value: any): CriteriaBuffer;

    not(value: any): CriteriaBuffer;

    in(value: any): CriteriaBuffer;

    notIn(value: any): CriteriaBuffer;
}

export interface CriteriaBuffer {
}

export interface RepeatSql<T> {
    bufferSize: number;
    push(entity: T): boolean;
}

export interface PageRequest {
    page: number;
    size: number;
    orders?: PageOrder[];
    fields?: string[];
}

export interface PageOrder {
    name: string;
    asc: boolean;
}

export interface PageResult<T> {
    total: number;
    page: number;
    size: number;
    list: T[];
}

///////////////////////////////////////////////////////////////////////////////
////  修饰器                                                                ////
///////////////////////////////////////////////////////////////////////////////
export function entity(options?: DataSchemaOptions) {
    return function (entityClass: Class<any>) {
        if (options) {
            registerEntity(entityClass, options)
        }
    }
}

export function id(options: DataFieldOptions) {
    return function (prototype: any, propertyName: string) {
        registerField(prototype.constructor, propertyName, options, true);
    }
}

export function column(options: DataFieldOptions) {
    return function (prototype: any, propertyName: string) {
        registerField(prototype.constructor, propertyName, options);
    }
}

export function repository(entityClass: Class<any>) {
    return function (repositoryClass: Class<any>) {
        binding.set(entityClass, repositoryClass)
    }
}

export function sql(sql?: string) {
    return function (prototype: any, methodName: string, descriptor: PropertyDescriptor) {
        registerMethod(prototype.constructor, methodName, sql);
    }
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

export interface DataMethod {
    name: string;
    sql: string;
}

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
