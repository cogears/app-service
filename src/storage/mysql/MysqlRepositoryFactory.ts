import { DataSchema } from "types";
import { StorageConnection, StorageRepositoryFactory } from "..";
import MysqlRepository from "./MysqlRepository";
import generator from "./MysqlSqlGenerator";

export default class MysqlRepositoryFactory implements StorageRepositoryFactory {
    private async loadTableDescription(connection: StorageConnection, name: string): Promise<string[]> {
        let fields: Array<any> = await connection.query('desc `' + name + '`');
        return fields.map(item => item.Field);
    }

    async createRepository<T>(connection: StorageConnection, schema: DataSchema<T>): Promise<MysqlRepository<T>> {
        if(schema.writable){
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
