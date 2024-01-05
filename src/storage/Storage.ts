import { MysqlConfig } from "types";
import { DataSchemaInfo, getSchemas, StorageConnection, StorageDriver } from ".";
import MysqlDriver from "./mysql/MysqlDriver";
import RepositoryFactory from "./RepositoryFactory";

export default class Storage {
    readonly name: string;
    private driver: StorageDriver;
    private repositoryFactory: RepositoryFactory;
    private schemas: Record<string, DataSchemaInfo<any>> = {};

    constructor(config: MysqlConfig) {
        this.name = config.name
        this.driver = new MysqlDriver(config);
        this.repositoryFactory = new RepositoryFactory(this.name, this.driver.getRepositoryFactory());
    }

    async initialize() {
        let connection = await this.getConnection();
        let schemaInfos: DataSchemaInfo<any>[] = getSchemas();
        for (let schema of schemaInfos) {
            await this.registerRepository(connection, schema);
        }
        connection.dispose();
    }

    private async registerRepository<T>(connection: StorageConnection, schema: DataSchemaInfo<T>): Promise<void> {
        if (schema.fields.length > 0) {
            await this.repositoryFactory.register(connection, schema);
            this.schemas[schema.name] = schema;
            if (schema.entityClass) {
                this.schemas[schema.entityClass.name] = schema;
            }
        } else {
            throw new Error('数据模型未定义字段:' + schema.name);
        }
    }

    getConnection(): Promise<StorageConnection> {
        return this.driver.getConnection();
    }

    getSchema(name: string): DataSchemaInfo<any> {
        if (this.schemas[name]) {
            return this.schemas[name];
        }
        throw new Error('找不到数据模型:' + name);
    }

    dispose() {
        this.driver.dispose();
    }
}