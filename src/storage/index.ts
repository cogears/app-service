import { Class, DataField, DataFieldOptions, DataSchema, PageRequest, Repository as IRepository, TaskContext } from "types";
export interface StorageDriver {
    getConnection(): Promise<StorageConnection>;

    getRepositoryFactory(): StorageRepositoryFactory;

    dispose(): void;
}

export interface StorageConnection {
    beginTransaction(): Promise<void>;

    query(sql: string, values?: Array<any>): Promise<any>;

    commit(): Promise<void>;

    rollback(): Promise<void>;

    dispose(): void;
}

export interface StorageRepository<T> {
    insert(connection: StorageConnection, entity: T): Promise<T>;

    update(connection: StorageConnection, entity: T): Promise<T>;

    save(connection: StorageConnection, entity: T): Promise<T>;

    delete(connection: StorageConnection, where?: string, values?: Array<any>): Promise<void>;

    count(connection: StorageConnection, where: string, values: Array<any>): Promise<number>;

    select(connection: StorageConnection, where: string, pageRequest?: PageRequest, values?: Array<any>): Promise<T[]>;
}

export interface StorageRepositoryFactory {
    createRepository<T>(connection: StorageConnection, schema: DataSchema<T>): Promise<StorageRepository<T>>;

    encode(value: any): string;
}

export class Repository<T> {
    private context: TaskContext;

    constructor(context: TaskContext) {
        this.context = context;
    }
}

interface EntityInfo {
    clazz: Class<any>;
    fields: DataField[];
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
    repositoryClass: Class<IRepository<T>>;
    methods: DataMethod[];
}

export function entity(options?: any) {
    return function (entityClass: Class<any>) {
    }
}

export function repository(entityClass: Class<any>) {
    return function (repositoryClass: Class<any>) {
        binding.set(entityClass, repositoryClass)
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

export function sql(sql?: string) {
    return function (prototype: any, methodName: string, descriptor: PropertyDescriptor) {
        registerMethod(prototype.constructor, methodName, sql);
    }
}

const binding: Map<any, any> = new Map();
const entities: Map<any, EntityInfo> = new Map();
const repositories: Map<any, RepositoryInfo> = new Map();

function registerField(entityClass: Class<any>, name: string, options: DataFieldOptions, isPrimaryKey: boolean = false) {
    let info = entities.get(entityClass);
    if (!info) {
        info = { clazz: entityClass, fields: [] };
        entities.set(entityClass, info);
    }
    let field: DataField = Object.assign({ name }, options);
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
                name: entityClass.name,
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