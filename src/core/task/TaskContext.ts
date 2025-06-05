import { Class } from "../../lang.js";
import { DataSchema, DataSchemaInfo } from "../../storage/decorate.js";
import { Repository } from "../../storage/index.js";
import { StorageConnection } from "../../storage/options.js";
import Storage from "../../storage/Storage.js";
import { Task } from "./index.js";
import TaskHandle from "./TaskHandle.js";
import TaskManager from "./TaskManager.js";

export default class TaskContext {
    /** @internal */
    private readonly mgr: TaskManager;
    /** @internal */
    private storageConnections: Record<string, StorageConnection> = {};
    /** @internal */
    constructor(mgr: TaskManager) {
        this.mgr = mgr;
    }

    getStorage(name?: string) {
        return new StorageApi(this.mgr.getStorage(name), this)
    }

    getStorageRepository<T>(target: string | Class<T>, storage?: string): Repository<T> {
        return this.getStorage(storage).getRepository(target)
    }

    /** @internal */
    async getStorageConnection(storage: string): Promise<StorageConnection> {
        if (!this.storageConnections[storage]) {
            this.storageConnections[storage] = await this.mgr.getStorage(storage).getConnection()
        }
        return this.storageConnections[storage];
    }

    /** @internal */
    async beginTransaction() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].beginTransaction();
        }
    }

    /** @internal */
    async commit() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].commit();
        }
    }

    /** @internal */
    async fallback() {
        for (let name in this.storageConnections) {
            await this.storageConnections[name].rollback();
        }
    }

    /** @internal */
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


export class StorageApi {
    /** @internal */
    private readonly storage: Storage
    /** @internal */
    private readonly context: TaskContext
    /** @internal */
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
