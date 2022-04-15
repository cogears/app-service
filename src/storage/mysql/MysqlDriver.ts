import { createPool, Pool, PoolConfig, PoolConnection } from "mysql";
import { MysqlConfig } from "types";
import { StorageDriver } from "..";
import MysqlConnection from "./MysqlConnection";
import MysqlRepositoryFactory from "./MysqlRepositoryFactory";

const TIMEOUT = 10000;
const DEFAULT = {
    port: 3306,
    connectionLimit: 20,
    queueLimit: 20,
    timezone: '+08:00'
};

export default class MysqlDriver implements StorageDriver {
    private readonly config: PoolConfig;
    private readonly pool: Pool;
    private readonly connections: Map<PoolConnection, MysqlConnection> = new Map();

    constructor(config: MysqlConfig) {
        this.config = Object.assign({}, DEFAULT, config);
        console.info('创建mysql链接池', this.config);
        this.pool = createPool(this.config);
        this.pool.on('connection', this.onConnectionCreated.bind(this));
        this.pool.on("release", this.onConnectionRelease.bind(this));
        this.pool.on("enqueue", this.onRequestQueued.bind(this));
    }

    getConnection(): Promise<MysqlConnection> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, instance) => {
                if (err) {
                    reject(err);
                } else {
                    let connection = new MysqlConnection(instance);
                    this.connections.set(instance, connection);
                    resolve(connection);
                }
            });
        });
    }

    getRepositoryFactory(): MysqlRepositoryFactory {
        return new MysqlRepositoryFactory();
    }

    dispose(): void {
        for (let connection of this.connections.values()) {
            connection.destroy();
        }
        this.connections.clear();
        this.pool.end();
    }

    private onConnectionCreated(connection: PoolConnection) {
        connection.query(`set time_zone = '${this.config.timezone}'`);
    }

    private onConnectionRelease(connection: PoolConnection) {
        this.connections.delete(connection);
    }

    private async onRequestQueued() {
        console.warn('等待空闲的数据库链接...');
        let now: number = Date.now();
        for (let key of this.connections.keys()) {
            let connection = this.connections.get(key);
            if (connection && now - connection.timestamp > TIMEOUT) {
                console.warn('回收一个泄露的数据库链接');
                this.connections.delete(key);
                await connection.rollback();
                connection.destroy();
            }
        }
    }
}