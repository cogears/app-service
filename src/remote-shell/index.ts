import { Request, Response } from "express";
import * as fs from 'fs';
import * as path from 'path';
import { DataSchema, HttpTask, TaskContext } from "types";
import { HttpError } from "../core/http/HttpError";
import AppContext, { http } from '../index';
import { USER_PATH } from "./config";
import * as fileTasks from './file';
import * as storageTasks from './storage';

const commandTasks: Record<string, (context: TaskContext, body: any) => Promise<any>> = {
    ...storageTasks,
    ...fileTasks,
}

export function startup(context: AppContext, path: string) {
    if (context.httpManager) {
        context.httpManager.addRoutes(path, [HelloTask, CommandTask])
    }
    context.schedule(loadStorages, 0)
}

export async function loadStorages(context: TaskContext) {
    console.info('load dynamic storages...')
    const storages = path.resolve(USER_PATH, 'storages')
    fs.mkdirSync(storages, { recursive: true })
    const files = fs.readdirSync(storages)
    for (let file of files) {
        let text = fs.readFileSync(path.resolve(storages, file), { encoding: 'utf8' })
        let data = JSON.parse(text)
        await storageTasks.create_table(context, data)
    }
}

export function saveStorage(data: DataSchema<any>) {
    const filepath = path.resolve(USER_PATH, 'storages', data.name)
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
