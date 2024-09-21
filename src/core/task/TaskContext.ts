import { Class, TaskContext as ITaskContext, Repository, Task } from "types";
import { StorageConnection } from "../../storage";
import TaskHandle from "./TaskHandle";
import TaskManager from "./TaskManager";

export default class TaskContext implements ITaskContext {
    private readonly mgr: TaskManager;
    private storageConnections: Record<string, StorageConnection> = {};

    constructor(mgr: TaskManager) {
        this.mgr = mgr;
    }

    getRepository<T>(target: string | Class<T>, storage?: string): Repository<T> {
        const name = typeof target == 'string' ? target : target.name;
        return this.mgr.getRepository(this, name, storage);
    }

    async getStorageConnection(storage: string): Promise<StorageConnection> {
        if (!this.storageConnections[storage]) {
            this.storageConnections[storage] = await this.mgr.getStorageConnection(storage);
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