import { Request, Response } from "express";
import fs from 'fs';
import { resolve } from 'path';
import HttpError from "../core/http/HttpError.js";
import { HttpTask } from "../core/http/index.js";
import TaskContext from "../core/task/TaskContext.js";
import AppContext, { http } from '../index.js';
import { DataSchema } from "../storage/decorate.js";
import { USER_PATH } from "./config.js";
import * as fileTasks from './file.js';
import * as storageTasks from './storage.js';

const commandTasks: Record<string, (context: TaskContext, body: any) => Promise<any>> = {
    ...storageTasks,
    ...fileTasks,
}
/** @internal */
export function startup(context: AppContext, path: string) {
    context.registerHttpUpload(resolve(USER_PATH, 'files/upload'), path, UploadTask)
    context.registerHttpRoutes(path, [HelloTask, CommandTask])
    context.registerHttpStatic('/remote', resolve(USER_PATH, 'files'))
    context.schedule(loadStorages, 0)
}
/** @internal */
export async function loadStorages(context: TaskContext) {
    console.info('load dynamic storages...')
    const storages = resolve(USER_PATH, 'storages')
    fs.mkdirSync(storages, { recursive: true })
    const files = fs.readdirSync(storages)
    for (let file of files) {
        let text = fs.readFileSync(resolve(storages, file), { encoding: 'utf8' })
        let data = JSON.parse(text)
        await storageTasks.create_table(context, data)
    }
}
/** @internal */
export function saveStorage(data: DataSchema<any>) {
    const filepath = resolve(USER_PATH, 'storages', data.name)
    fs.writeFileSync(filepath, JSON.stringify(data, undefined, 4), { encoding: 'utf8' })
}

@http.api({ method: 'get', url: '/' })
class HelloTask implements HttpTask {
    async execute(context: TaskContext, req: Request, res: Response): Promise<any> {
        return 'hello world'
    }
}

@http.api({ method: 'post', url: '/:command' })
class CommandTask implements HttpTask {

    @http.param({ name: 'command', type: 'string', required: true })
    command!: string

    @http.body()
    body!: any

    async execute(context: TaskContext): Promise<any> {
        const command = this.command.toLowerCase().split('-').join('_')
        if (commandTasks[command]) {
            let result = await commandTasks[command](context, this.body)
            return result || {}
        } else {
            throw new HttpError(404, 'unknow command:' + this.command)
        }
    }
}

@http.api({ method: 'post', url: '/upload' })
class UploadTask implements HttpTask {
    @http.body()
    body!: any

    async execute(context: TaskContext, req: Request, res: Response): Promise<any> {
        if (req.file) {
            const source = 'upload/' + req.file.filename
            const target = req.body.target
            if (target) {
                await fileTasks.rm(context, { target })
                await fileTasks.mv(context, { source, target })
                return target
            } else {
                return source
            }
        }
        return 'ok'
    }
}