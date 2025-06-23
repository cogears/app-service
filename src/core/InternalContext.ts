import { Class } from '../index.js';
import { MysqlConfig } from '../storage/index.js';
import Storage from "../storage/Storage.js";
import HttpManager from './http/HttpManager.js';
import { HttpConfig, HttpTask } from './http/index.js';
import LogFactory from './LogFactory.js';
import { Task, TaskHandle } from './task/index.js';
import TaskManager from './task/TaskManager.js';
/** @internal */
export default class InternalContext {
    private _taskManager: TaskManager
    private _httpManager?: HttpManager
    private _storages: Record<string, Storage> = {}
    private _storage?: Storage
    private _waitForStorage: number = 0
    constructor() {
        this._taskManager = new TaskManager(this)
    }

    get ready(): boolean {
        return this._waitForStorage == 0
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

    async installHttp(config: HttpConfig): Promise<void> {
        this._httpManager = new HttpManager(this)
        await this._httpManager.startup(config)
    }

    async installStorage(config: MysqlConfig): Promise<void> {
        this._waitForStorage++
        this._storages[config.name] = new Storage(config)
        if (!this._storage) {
            this._storage = this._storages[config.name]
        }
        await this._storages[config.name].initialize()
        this._waitForStorage--
        this.onReady()
    }

    installLog(logPath: string = ''): void {
        LogFactory(logPath)
    }

    registerHttpRoutes(path: string, tasks: Class<HttpTask>[]): void {
        this._httpManager?.addRoutes(path, tasks)
    }

    registerHttpStatic(path: string, directory: string): void {
        this._httpManager?.setStatic(path, directory)
    }

    schedule(task: Task, delay?: number): TaskHandle {
        return this._taskManager.schedule(task, delay);
    }

    schedulePeriodTask(task: Task, period: number): TaskHandle {
        return this._taskManager.schedulePeriodTask(task, period)
    }

    dispose(): void {
        for (let k in this._storages) {
            this._storages[k].dispose()
        }
        this._taskManager.dispose();
    }
}