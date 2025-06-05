import http from '@cogears/http-client'
import { DataSchema, PageRequest } from '../storage/index.js'

export function generateClient(routePath: string = '/'): CallRemote {
    if (!routePath.endsWith('/')) {
        routePath += '/'
    }
    //@ts-ignore
    return function callRemote(command: string, data: any) {
        return http.post(`${routePath}${command}`, data)
    }
}


export interface CallRemote {
    (cmd: 'mkdir', data: { target: string }): Promise<void>,
    (cmd: 'ls', data: { target: string }): Promise<void>,
    (cmd: 'cp', data: { source: string, target: string }): Promise<void>,
    (cmd: 'mv', data: { source: string, target: string }): Promise<void>,
    (cmd: 'rename', data: { source: string, target: string }): Promise<void>,
    (cmd: 'read', data: { target: string }): Promise<string>,
    (cmd: 'write', data: { target: string, data: string }): Promise<void>,
    (cmd: 'rm', data: { target: string }): Promise<void>,

    (cmd: 'create-table', data: DataSchema<any>): Promise<void>,
    (cmd: 'clear-table', data: { table: string }): Promise<void>
    (cmd: 'insert-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'update-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'save-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'delete-data', data: { table: string, key: any }): Promise<void>
    (cmd: 'get-data', data: { table: string, key: any }): Promise<any>
    (cmd: 'select-data', data: { table: string, pageRequest: PageRequest }): Promise<any[]>
}