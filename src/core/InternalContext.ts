import { MysqlConfig, Task } from 'types';
import Storage from "../storage/Storage";
import TaskManager from './task/TaskManager';

export default class InternalContext {
    private _taskManager: TaskManager;
    private _storage?: Storage
    constructor() {
        this._taskManager = new TaskManager(this);
    }

    get storage(): Storage {
        if (this._storage) {
            return this._storage
        }
        throw new Error('尚未配置安装数据库存储模块')
    }

    async installStorage(config: MysqlConfig) {
        this._storage = new Storage(config);
        await this._storage.initialize();
    }

    start(task: Task) {
        this._taskManager.schedule(task);
    }

    dispose() {
        if (this.storage) {
            this.storage.dispose();
        }
        this._taskManager.dispose();
    }
}