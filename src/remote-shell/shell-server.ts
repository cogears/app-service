import fs from 'fs';
import path from 'path';
import HttpError from '../core/http/HttpError.js';
import TaskContext from "../core/task/TaskContext.js";
import { DataSchema } from "../storage/decorate.js";
import { ShellWorker } from './ShellWorker.js';
import { FileWorker } from './workers/file.js';
import { StorageWorker } from "./workers/storage.js";

export class ShellServer {
    /** @internal */
    static TAG = '[shell]'
    readonly workspace: string
    readonly fileWorker: FileWorker
    readonly storageWorker: StorageWorker
    /** @internal */
    private readonly jobWorkers: ShellWorker[]

    /** @internal */
    constructor(workspace: string) {
        this.workspace = workspace
        this.fileWorker = new FileWorker(this.staticDir)
        this.storageWorker = new StorageWorker()
        this.jobWorkers = [this.fileWorker, this.storageWorker]
    }

    get staticDir() {
        return path.join(this.workspace, 'static')
    }

    get storageDir() {
        return path.join(this.workspace, 'storage')
    }

    registerJobWorker(worker: ShellWorker) {
        this.jobWorkers.push(worker)
    }

    /** @internal */
    async loadStorages(context: TaskContext) {
        const dirpath = this.storageDir
        fs.mkdirSync(dirpath, { recursive: true })
        const files = fs.readdirSync(dirpath)
        console.info(ShellServer.TAG, 'load dynamic storages from', dirpath, files)
        for (let file of files) {
            let text = fs.readFileSync(path.join(dirpath, file), { encoding: 'utf8' })
            let data = JSON.parse(text)
            await this.storageWorker.createTable(context, data)
        }
    }

    /** @internal */
    async saveStorage(data: DataSchema<any>) {
        const filepath = path.join(this.storageDir, data.name)
        fs.writeFileSync(filepath, JSON.stringify(data, undefined, 4), { encoding: 'utf8' })
        console.info(ShellServer.TAG, 'save storage', filepath)
    }

    /** @internal */
    async uploadFile(context: TaskContext, source: string, target: string) {
        await this.fileWorker.rm(context, { target })
        await this.fileWorker.mv(context, { source, target })
    }

    /** @internal */
    async executeCommand(context: TaskContext, command: string, data: any): Promise<any> {
        for (const worker of this.jobWorkers) {
            if (worker[command]) {
                const result = await worker[command](context, data)
                if (command == 'createTable') {
                    this.saveStorage(data)
                }
                return result || {}
            }
        }
        throw new HttpError(404, 'unknow command: ' + command)
    }
}

