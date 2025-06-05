import { Class } from "../../lang.js"
import { HttpMethod, HttpTask } from "./index.js"

export interface ApiOptions {
    method: HttpMethod,
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

function registerApi(entityClass: Class<any>, options: ApiOptions) {
    let info = getApiInfo(entityClass)
    Object.assign(info, options)
}
function registerParam(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getApiInfo(entityClass)
    info.params.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerHeader(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getApiInfo(entityClass)
    info.headers.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerQuery(entityClass: Class<any>, alias: string, options: QueryOptions) {
    let info = getApiInfo(entityClass)
    info.querys.push(Object.assign({ alias, name: alias, type: 'string' }, options))
}
function registerBody(entityClass: Class<any>, alias: string) {
    let info = getApiInfo(entityClass)
    info.body = { alias }
}

/** @internal */
export interface ApiInfo<T extends HttpTask> {
    clazz: Class<T>,
    method: HttpMethod,
    url: string,
    params: ApiField[],
    querys: ApiField[],
    headers: ApiField[],
    body?: BodyField
}
/** @internal */
export interface ApiField {
    type: 'string' | 'number',
    name: string,
    alias: string,
    required?: boolean,
}
/** @internal */
export interface BodyField {
    alias: string,
}
/** @internal */
export const apis: Map<any, ApiInfo<any>> = new Map();
function getApiInfo(entityClass: Class<any>) {
    let info = apis.get(entityClass);
    if (!info) {
        info = { clazz: entityClass, method: 'get', url: '', params: [], querys: [], headers: [] };
        apis.set(entityClass, info);
    }
    return info
}
