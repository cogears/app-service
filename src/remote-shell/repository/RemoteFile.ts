import { Repository, storage } from "../../storage/index.js"

@storage.entity({ name: 'file' })
export class RemoteFile {
    @storage.id({ name: 'filepath', type: 'string', len: 256 })
    filepath!: string

    @storage.column({ name: 'dirname', type: 'string', len: 256 })
    dirname!: string

    @storage.column({ name: 'extname', type: 'string', len: 16 })
    extname!: string

    @storage.column({ name: 'description', type: 'string', len: 256 })
    description!: string

    @storage.column({ name: 'size', type: 'int' })
    size!: number

    @storage.column({ name: 'createTime', type: 'datetime' })
    createTime!: Date

    @storage.column({ name: 'modifyTime', type: 'datetime', update: true })
    modifyTime!: Date
}

@storage.repository(RemoteFile)
export class RemoteFileRepository extends Repository<RemoteFile> {

}
