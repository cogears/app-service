import { DataSchema, PageRequest, RepeatSql } from './index.js';

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

    generateRepeat(): RepeatSql<T>;

    submitRepeat(connection: StorageConnection, repeat: RepeatSql<T>): Promise<void>;

    transform(list: any[]): T[]
}

export interface StorageRepositoryFactory {
    createRepository<T>(connection: StorageConnection, schema: DataSchema<T>): Promise<StorageRepository<T>>;

    encode(value: any): string;
}