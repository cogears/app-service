import { DataSchema, DataSchemaInfo, Repository } from "../../storage/index.js";
import { StorageConnection } from "../../storage/options.js";
import Storage from "../../storage/Storage.js";
import TaskHandle from "./TaskHandle.js";
import TaskManager from "./TaskManager.js";

export interface Task {
    (context: TaskContext): void;
}

export default class TaskContext {
    private readonly mgr: TaskManager;
    private storageConnections: Record<string, StorageConnection> = {};

    constructor(mgr: TaskManager) {
        this.mgr = mgr;
    }

    getStorage(name?: string) {
        return new StorageApi(this.mgr.getStorage(name), this)
    }

    getStorageRepository<T>(target: string | Class<T>, storage?: string): Repository<T> {
        return this.getStorage(storage).getRepository(target)
    }

    async getStorageConnection(storage: string): Promise<StorageConnection> {
        if (!this.storageConnections[storage]) {
            this.storageConnections[storage] = await this.mgr.getStorage(storage).getConnection()
        }
        return this.storageConnections[storage];
    }

    async beginTransaction() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].beginTransaction();
        }
    }

    async commit() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].commit();
        }
    }

    async fallback() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].rollback();
        }
    }

    dispose() {
        for (let name in this.storageConnections) {
            this.storageConnections[name].dispose();
        }
    }

    schedule(task: Task, delay?: number): TaskHandle {
        return this.mgr.schedule(task, delay);
    }

    schedulePeriodTask(task: Task, period: number): TaskHandle {
        return this.mgr.schedulePeriodTask(task, period);
    }
}


class StorageApi {
    private readonly storage: Storage
    private readonly context: TaskContext
    constructor(storage: Storage, context: TaskContext) {
        this.storage = storage
        this.context = context
    }

    async createRepository<T>(schema: DataSchema<T>) {
        const connection = await this.context.getStorageConnection(this.storage.name)
        await this.storage.registerRepository(connection, schema as DataSchemaInfo<T>)
    }

    getRepository<T>(target: string | Class<T>): Repository<T> {
        const name = typeof target == 'string' ? target : target.name;
        const schema = this.storage.getSchema(name)
        return new schema.repositoryClass(this.context);
    }
}
