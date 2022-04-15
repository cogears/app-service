import { PoolConnection } from "mysql";
import { StorageConnection } from "..";

export default class MysqlConnection implements StorageConnection {
    private readonly connection: PoolConnection;
    readonly timestamp: number;

    constructor(connection: PoolConnection) {
        this.connection = connection;
        this.timestamp = Date.now();
    }

    query(sql: string, values?: Array<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('[SQL]', sql, values ? values : '');
            this.connection.query(sql, values, (err, results) => {
                err ? reject(err) : resolve(results);
            });
        });
    }

    beginTransaction(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.beginTransaction(err => {
                err ? reject(err) : resolve();
            });
        });
    }

    commit(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.commit(err => {
                err ? reject(err) : resolve();
            });
        });
    }

    rollback(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.rollback(err => {
                err ? reject(err) : resolve();
            });
        });
    }

    dispose(): void {
        this.connection.release();
    }

    destroy() {
        this.connection.destroy();
    }
}
