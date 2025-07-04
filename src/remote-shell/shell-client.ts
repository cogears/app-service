import Http from '@cogears/http-client'
import { DataSchema, PageRequest } from '../storage/index.js'

const http = Http()

export function generateClient(routePath: string = '/'): CallRemote {
    if (!routePath.endsWith('/')) {
        routePath += '/'
    }
    return async function callRemote(command: string, data: any) {
        let body: any
        if (command == 'upload') {
            body = http.file('file', data.file)
            body.form.append('target', data.target)
        } else {
            body = http.json(data)
        }
        let response = await http.post(`${routePath}${command}`, body)
        if (response.status >= 200 && response.status <= 204) {
            let result = JSON.parse(response.body)
            if (result.code == 0) {
                return result.data
            } else {
                throw new Error(`RemoteCall Fail: ${result.code}_` + result.data)
            }
        } else {
            throw new Error(`RemoteCall Fail: ` + response.body)
        }
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
    (cmd: 'upload', data: { target: string, file: File }): Promise<string>

    (cmd: 'create-table', data: DataSchema<any>): Promise<void>,
    (cmd: 'clear-table', data: { table: string }): Promise<void>
    (cmd: 'insert-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'update-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'save-data', data: { table: string, data: any }): Promise<void>
    (cmd: 'delete-data', data: { table: string, key: any }): Promise<void>
    (cmd: 'get-data', data: { table: string, key: any }): Promise<any>
    (cmd: 'select-data', data: { table: string, pageRequest: PageRequest }): Promise<any[]>
}