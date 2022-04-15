import { DataSchema, PageRequest } from "types";
import { StorageConnection, StorageRepository } from "..";
import generator from "./MysqlSqlGenerator";

export default class MysqlRepository<T> implements StorageRepository<T> {
    private readonly schema: DataSchema<T>;

    constructor(schema: DataSchema<T>) {
        this.schema = schema;
    }

    get name() {
        return this.schema.name;
    }

    async insert(connection: StorageConnection, entity: T): Promise<T> {
        let result = await connection.query(generator.getInsert(this.schema, entity));
        if (result.insertId > 0) {
            let key = this.schema.fields[0].name;
            // @ts-ignore
            entity[key] = result.insertId;
        }
        return entity;
    }

    async update(connection: StorageConnection, entity: T): Promise<T> {
        let sql = generator.getUpdate(this.schema, entity);
        if (sql) {
            await connection.query(sql);
        }
        return entity;
    }

    async save(connection: StorageConnection, entity: T): Promise<T> {
        let result = await connection.query(generator.getSave(this.schema, entity));
        if (result.insertId > 0) {
            let key = this.schema.fields[0].name;
            // @ts-ignore
            entity[key] = result.insertId;
        }
        return entity;
    }

    async delete(connection: StorageConnection, where?: string, values?: Array<any>): Promise<any> {
        return await connection.query(generator.getDelete(this.schema, where), values);
    }

    async count(connection: StorageConnection, where: string, values: Array<any>): Promise<number> {
        let result = await connection.query(generator.getCount(this.schema, where), values);
        return result[0].value as number;
    }

    async select(connection: StorageConnection, where: string, pageRequest?: PageRequest, values?: Array<any>): Promise<T[]> {
        let list: any[] = await connection.query(generator.getSelect(this.schema, where, pageRequest), values);
        return list.map(item => this.transform(item));
    }

    private transform(data: any): T {
        let instance: any = this.schema.entityClass ? new this.schema.entityClass() : {};
        for (let field of this.schema.fields) {
            instance[field.name] = data[field.name];
        }
        return instance as T;
    }

}