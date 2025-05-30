import { HttpConfig, MysqlConfig, Task } from 'types';
import { LogFactory } from '../common';
import Storage from "../storage/Storage";
import HttpManager from './http/HttpManager';
import TaskManager from './task/TaskManager';

export default class InternalContext {
    static readonly READY: string = 'ready'
    private _taskManager: TaskManager
    private _httpManager?: HttpManager
    private _storages: Record<string, Storage> = {}
    private _storage?: Storage
    private _waitForStorage: number = 0
    constructor() {
        this._taskManager = new TaskManager(this)
    }

    get ready() {
        return this._waitForStorage == 0
    }

    get httpManager() {
        return this._httpManager
    }

    getStorage(name?: string): Storage {
        if (name) {
            if (this._storages[name]) {
                return this._storages[name]
            }
        } else {
            if (this._storage) {
                return this._storage
            }
        }
        throw new Error('尚未配置安装数据库存储模块:' + (name || 'default'))
    }

    private onReady() {
        if (this.ready) {
            this._taskManager.notify()
        }
    }

    installHttp(config: HttpConfig) {
        this._httpManager = new HttpManager(this, config)
        return this._httpManager
    }
    async installStorage(config: MysqlConfig) {
        this._waitForStorage++
        this._storages[config.name] = new Storage(config)
        if (!this._storage) {
            this._storage = this._storages[config.name]
        }
        await this._storages[config.name].initialize()
        this._waitForStorage--
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
        for (let k in this._storages) {
            this._storages[k].dispose()
        }
        this._taskManager.dispose();
    }
}