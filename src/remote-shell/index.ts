import { HttpError } from "src/core/http/HttpError";
import { HttpTask, TaskContext } from "types";
import AppContext, { http } from '../index';
import * as fileTasks from './file';
import * as storageTasks from './storage';

const commandTasks: Record<string, (context: TaskContext, body: any) => Promise<any>> = {
    ...storageTasks,
    ...fileTasks,
}

export function startup(context: AppContext, path: string) {
    if (context.httpManager) {
        context.httpManager.addRoutes(path, [CommandTask])
    }
}

@http.api({ method: 'get', url: '/:command' })
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
