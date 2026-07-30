import { Request, Response } from "express";
import path from 'path';
import HttpError from "../core/http/HttpError.js";
import { HttpTask } from "../core/http/index.js";
import TaskContext from "../core/task/TaskContext.js";
import AppContext, { http } from '../index.js';
import { ShellServer } from "./shell-server.js";
import os from 'os';

let server: ShellServer

/** @internal */
export function startup(context: AppContext, workspace: string, uri: string) {
    workspace = path.resolve(os.homedir(), workspace)
    console.info(ShellServer.TAG, 'startup shell server on', workspace, uri)
    server = new ShellServer(workspace)

    context.registerHttpStatic(uri + '/static', server.staticDir)
    context.registerHttpUpload(uri, server.staticDir, UploadTask)
    context.registerHttpRoutes(uri, [HelloTask, CommandTask])
    context.schedule(taskContext => {
        server.loadStorages(taskContext)
    }, 0)
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
        try {
            const result = await server.executeCommand(context, this.command, this.body)
            return result || {}
        } catch (err: any) {
            if (err instanceof HttpError) {
                throw err
            }
            throw new HttpError(500, err.message)
        }
    }
}

@http.api({ method: 'post', url: '/upload' })
class UploadTask implements HttpTask {
    @http.body()
    body!: any

    async execute(context: TaskContext, req: Request, res: Response): Promise<any> {
        if (req.file) {
            const source = req.file.filename
            const target = req.body.target
            if (target) {
                return server.uploadFile(context, source, target)
            } else {
                return source
            }
        }
        return 'ok'
    }
}