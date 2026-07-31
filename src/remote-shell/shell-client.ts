import { DataSchema, PageRequest } from '../storage/index.js'

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
        let options: RequestInit = {
            method: 'post'
        }
        if (command == 'upload') {
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('target', data.target);
            options.body = formData
        } else {
            options.headers = {
                'Content-Type': 'application/json'
            }
            options.body = JSON.stringify(data)
        }
        const response = await fetch(`${this.routePath}${command}`, options)
        if (response.ok) {
            const result = await response.json();
            if (result.code == 0) {
                return result.data
            } else {
                throw new Error(`RemoteCall Fail: ${result.code}_` + result.data)
            }
        } else {
            throw new Error(`RemoteCall Fail: ` + response.body)
        }
    }

    async downloadStatic(target: string): Promise<Blob> {
        const response = await fetch(`${this.routePath}static/${target}`)
        if (response.ok) {
            return await response.blob()
        }
        throw new Error(`Download Fail: ` + response.body)
    }

    tree(): Promise<RemoteFile[]> {
        return this.sendRequest('tree', {})
    }

    mkdir(target: string) {
        return this.sendRequest('mkdir', { target })
    }

    ls(target: string): Promise<RemoteFile[]> {
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

    download(target: string): Promise<Blob> {
        return this.downloadStatic(target)
    }

    createTable(data: DataSchema<any>) {
        return this.sendRequest('createTable', data)
    }

    clearTable(table: string) {
        return this.sendRequest('clearTable', { table })
    }

    insertData(table: string, data: any) {
        return this.sendRequest('insertData', { table, data })
    }

    updateData(table: string, data: any) {
        return this.sendRequest('updateData', { table, data })
    }

    saveData(table: string, data: any) {
        return this.sendRequest('saveData', { table, data })
    }

    deleteData(table: string, key: any) {
        return this.sendRequest('deleteData', { table, key })
    }

    getData(table: string, key: any) {
        return this.sendRequest('getData', { table, key })
    }

    selectData(table: string, pageRequest: PageRequest) {
        return this.sendRequest('selectData', { table, pageRequest })
    }
}

export interface RemoteFile {
    filepath: string,
    name: string,
    isDirectory: boolean,
    size: number,
    ctime: number,
    mtime: number,
    children: RemoteFile[],
    content?: any
}