import { Request, Response } from 'express'
import { TaskContext } from './common'
import { Class } from './lang'

export interface HttpConfig {
    port: number,
    jsonFilter?: (key: any, value: any) => any
}

export interface HttpTask {
    execute(context: TaskContext, req: Request, res: Response): Promise<any>
}

export interface HttpManager {
    addRoutes(path: string, tasks: Class<HttpTask>[]): HttpManager
}

export type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface ApiOptions {
    method: ApiMethod,
    url: string,
}

export interface QueryOptions {
    type?: 'string' | 'number',
    name: string,
    required?: boolean,
}

///////////////////////////////////////////////////////////////////////////////
////  修饰器                                                                ////
///////////////////////////////////////////////////////////////////////////////

export const http: {
    api(options: ApiOptions): Function
    param(options: QueryOptions): Function
    query(options: QueryOptions): Function
    header(options: QueryOptions): Function
    body(): Function
}