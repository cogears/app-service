import { Repository, Task, TaskContext as ITaskContext } from "types";
import { StorageConnection } from "../../storage";
import TaskHandle from "./TaskHandle";
import TaskManager from "./TaskManager";

export default class TaskContext implements ITaskContext {
    private readonly mgr: TaskManager;
    private storageConnection?: StorageConnection;

    constructor(mgr: TaskManager) {
        this.mgr = mgr;
    }

    getRepository(name: string, storage?: string): Repository<any> {
        return this.mgr.getRepository(this, name, storage);
    }

    async getStorageConnection(storage?: string): Promise<StorageConnection> {
        if (!this.storageConnection) {
            this.storageConnection = await this.mgr.getStorageConnection(storage);
        }
        return this.storageConnection;
    }

    async beginTransaction() {
        if (this.storageConnection) {
            await this.storageConnection.beginTransaction();
        }
    }

    async commit() {
        if (this.storageConnection) {
            await this.storageConnection.commit();
        }
    }

    async fallback() {
        if (this.storageConnection) {
            await this.storageConnection.rollback();
        }
    }

    dispose() {
        if (this.storageConnection) {
            this.storageConnection.dispose();
        }
    }

    schedule(task: Task, delay?: number): TaskHandle {
        return this.mgr.schedule(task, delay);
    }

    schedulePeriodTask(task: Task, period: number): TaskHandle {
        return this.mgr.schedulePeriodTask(task, period);
    }
}