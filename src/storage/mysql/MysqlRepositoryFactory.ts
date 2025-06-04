import { DataSchema } from "../index.js";
import { StorageConnection, StorageRepositoryFactory } from '../options.js';
import MysqlRepository from "./MysqlRepository.js";
import generator from "./MysqlSqlGenerator.js";

export default class MysqlRepositoryFactory implements StorageRepositoryFactory {
    private async loadTableDescription(connection: StorageConnection, name: string): Promise<string[]> {
        let fields: Array<any> = await connection.query('desc `' + name + '`');
        return fields.map(item => item.Field);
    }

    async createRepository<T>(connection: StorageConnection, schema: DataSchema<T>): Promise<MysqlRepository<T>> {
        if (schema.writable) {
            try {
                let fields = await this.loadTableDescription(connection, schema.name);
                await connection.query(generator.getAlter(schema, fields));
            } catch (e) {
                console.info(`表${schema.name}不存在，开始创建...`);
                await connection.query(generator.getCreate(schema));
            }
        }
        return new MysqlRepository<T>(schema);
    }

    encode(value: any): string {
        return generator.encode(value);
    }
}
