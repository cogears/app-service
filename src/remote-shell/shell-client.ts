import Http from '@cogears/http-client'
import { DataSchema, PageRequest } from '../storage/index.js'

const http = Http()

export class ShellClient {
    /** @internal */
    private readonly routePath: string
    constructor(routePath: string = '/') {
        if (!routePath.endsWith('/')) {
            routePath += '/'
        }
        this.routePath = routePath
    }

    async sendRequest(command: string, data: any) {
        let body: any
        if (command == 'upload') {
            body = http.file('file', data.file)
            body.form.append('target', data.target)
        } else {
            body = http.json(data)
        }
        let response = await http.post(`${this.routePath}${command}`, body)
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

    mkdir(target: string) {
        return this.sendRequest('mkdir', { target })
    }

    ls(target: string) {
        return this.sendRequest('ls', { target })
    }

    cp(source: string, target: string) {
        return this.sendRequest('cp', { source, target })
    }

    mv(source: string, target: string) {
        return this.sendRequest('mv', { source, target })
    }

    rename(source: string, target: string) {
        return this.sendRequest('rename', { source, target })
    }

    read(target: string) {
        return this.sendRequest('read', { target })
    }

    write(target: string, data: string) {
        return this.sendRequest('write', { target, data })
    }

    rm(target: string) {
        return this.sendRequest('rm', { target })
    }

    upload(target: string, file: File) {
        return this.sendRequest('upload', { target, file })
    }

    createTable(data: DataSchema<any>) {
        return this.sendRequest('create-table', data)
    }

    clearTable(table: string) {
        return this.sendRequest('clear-table', { table })
    }

    insertData(table: string, data: any) {
        return this.sendRequest('insert-data', { table, data })
    }

    updateData(table: string, data: any) {
        return this.sendRequest('update-data', { table, data })
    }

    saveData(table: string, data: any) {
        return this.sendRequest('save-data', { table, data })
    }

    deleteData(table: string, key: any) {
        return this.sendRequest('delete-data', { table, key })
    }

    getData(table: string, key: any) {
        return this.sendRequest('get-data', { table, key })
    }

    selectData(table: string, pageRequest: PageRequest) {
        return this.sendRequest('select-data', { table, pageRequest })
    }
}
