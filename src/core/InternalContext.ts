import { MysqlConfig, Task } from 'types';
import Storage from "../storage/Storage";
import TaskManager from './task/TaskManager';
import { LogFactory } from '../common';

export default class InternalContext {
    static readonly READY: string = 'ready'
    private _taskManager: TaskManager
    private _storage?: Storage
    private _ready: boolean = false
    constructor() {
        this._taskManager = new TaskManager(this)
        this._ready = true
    }

    get ready() {
        return this._ready
    }

    get storage(): Storage {
        if (this._storage) {
            return this._storage
        }
        throw new Error('尚未配置安装数据库存储模块')
    }

    private onReady() {
        this._ready = true
        this._taskManager.notify()
    }

    async installStorage(config: MysqlConfig) {
        this._ready = false
        this._storage = new Storage(config)
        await this._storage.initialize()
        this.onReady()
    }

    installLog(logPath: string = '') {
        LogFactory(logPath)
    }

    schedule(task: Task, delay?: number) {
        return this._taskManager.schedule(task, delay);
    }

    schedulePeriodTask(task: Task, period: number) {
        return this._taskManager.schedulePeriodTask(task, period)
    }

    dispose() {
        if (this._storage) {
            this._storage.dispose();
        }
        this._taskManager.dispose();
    }
}