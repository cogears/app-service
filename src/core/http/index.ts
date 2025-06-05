import { Request, Response } from "express"
import TaskContext from "../task/TaskContext.js"
export { ApiOptions, http, QueryOptions } from './decorate.js'

export interface HttpConfig {
    port: number,
    jsonFilter?: (key: any, value: any) => any
}

export interface HttpTask {
    execute(context: TaskContext, req: Request, res: Response): Promise<any>
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'