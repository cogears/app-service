import { Request, Response } from "express"
import TaskContext from "../task/TaskContext.js"

export interface HttpConfig {
    port: number,
    jsonFilter?: (key: any, value: any) => any
}

export interface HttpTask {
    execute(context: TaskContext, req: Request, res: Response): Promise<any>
}


///////////////////////////////////////////////////////////////////////////////
////  修饰器                                                                ////
///////////////////////////////////////////////////////////////////////////////
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


export const http = {
    api(options: ApiOptions) {
        return function (entityClass: Class<any>) {
            if (options) {
                registerApi(entityClass, options)
            }
        }
    },
    param(options: QueryOptions) {
        return function (prototype: any, propertyName: string) {
            registerParam(prototype.constructor, propertyName, options);
        }
    },
    header(options: QueryOptions) {
        return function (prototype: any, propertyName: string) {
            registerHeader(prototype.constructor, propertyName, options);
        }
    },
    query(options: QueryOptions) {
        return function (prototype: any, propertyName: string) {
            registerQuery(prototype.constructor, propertyName, options);
        }
    },
    body() {
        return function (prototype: any, propertyName: string) {
            registerBody(prototype.constructor, propertyName);
        }
    },
}

export interface ApiInfo<T extends HttpTask> {
    clazz: Class<T>,
    method: ApiMethod,
    url: string,
    params: ApiField[],
    querys: ApiField[],
    headers: ApiField[],
    body?: BodyField
}

export interface ApiField {
    type: 'string' | 'number',
    name: string,
    alias: string,
    required?: boolean,
}

interface BodyField {
    alias: string,
}

export const apis: Map<any, ApiInfo<any>> = new Map();

function getInfo(entityClass: Class<any>) {
    let info = apis.get(entityClass);
    if (!info) {
        info = { clazz: entityClass, method: 'get', url: '', params: [], querys: [], headers: [] };
        apis.set(entityClass, info);
    }
    return info
}
function registerApi(entityClass: Class<any>, options: ApiOptions) {
    let info = getInfo(entityClass)
    Object.assign(info, options)
}
function registerParam(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getInfo(entityClass)
    info.params.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerHeader(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getInfo(entityClass)
    info.headers.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerQuery(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getInfo(entityClass)
    info.querys.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerBody(entityClass: Class<any>, alias: string) {
    let info = getInfo(entityClass)
    info.body = { alias }
}