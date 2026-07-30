import fs from 'fs';
import path from 'path';
import HttpError from '../../core/http/HttpError.js';
import TaskContext from '../../core/task/TaskContext.js';
import { ShellWorker } from '../ShellWorker.js';
import { RemoteFile } from '../repository/RemoteFile.js';

/** @internal */
export class FileWorker extends ShellWorker {
    //@ts-ignore
    private readonly workspace: string
    constructor(workspace: string) {
        super()
        this.workspace = workspace
    }

    async mkdir(_context: TaskContext, { target }: any) {
        const filepath = path.join(this.workspace, target)
        fs.mkdirSync(filepath, { recursive: true })
    }

    async ls(_context: TaskContext, { target }: any) {
        const filepath = path.join(this.workspace, target)
        if (!fs.existsSync(filepath)) {
            throw new HttpError(404, 'target not found: ' + target)
        }
        if (fs.statSync(filepath).isDirectory()) {
            return fs.readdirSync(filepath)
        } else {
            return [path.basename(filepath)]
        }
    }

    async cp(context: TaskContext, { source, target }: any) {
        const filepath1 = path.join(this.workspace, source)
        const filepath2 = path.join(this.workspace, target)
        if (!fs.existsSync(filepath1)) {
            throw new HttpError(404, 'source not found: ' + source)
        }
        if (fs.existsSync(filepath2)) {
            throw new HttpError(403, 'target is existed: ' + target)
        }
        fs.mkdirSync(path.dirname(filepath2), { recursive: true })
        fs.cpSync(filepath1, filepath2)
        const repository = context.getStorageRepository(RemoteFile)
        const entity = this.createEntity(target)
        await repository.save(entity)
    }

    async mv(_context: TaskContext, { source, target }: any) {
        this.rename(_context, { source, target })
    }

    async rename(context: TaskContext, { source, target }: any) {
        const filepath1 = path.join(this.workspace, source)
        const filepath2 = path.join(this.workspace, target)
        if (!fs.existsSync(filepath1)) {
            throw new HttpError(404, 'source not found: ' + source)
        }
        if (fs.existsSync(filepath2)) {
            throw new HttpError(403, 'target is existed: ' + target)
        }
        fs.mkdirSync(path.dirname(filepath2), { recursive: true })
        fs.renameSync(filepath1, filepath2)
        const repository = context.getStorageRepository(RemoteFile)
        await repository.delete(source)
        const entity = this.createEntity(target)
        await repository.save(entity)
    }

    async read(_context: TaskContext, { target }: any) {
        const filepath = path.join(this.workspace, target)
        if (!fs.existsSync(filepath)) {
            throw new HttpError(404, 'target not found: ' + target)
        }
        if (fs.statSync(filepath).isDirectory()) {
            throw new HttpError(403, 'target is directory:' + target)
        }
        return fs.readFileSync(filepath, { encoding: 'utf8' })
    }

    async write(context: TaskContext, { target, data }: any) {
        const filepath = path.join(this.workspace, target)
        if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
            throw new HttpError(403, 'target is directory:' + target)
        }
        fs.mkdirSync(path.dirname(filepath), { recursive: true })
        fs.writeFileSync(filepath, data, { encoding: 'utf8' })

        const entity = this.createEntity(target)
        await context.getStorageRepository(RemoteFile).save(entity)
    }

    async rm(context: TaskContext, { target }: any) {
        const filepath = path.join(this.workspace, target)
        if (fs.existsSync(filepath)) {
            fs.rmSync(filepath)
        }
        await context.getStorageRepository(RemoteFile).delete(target)
    }

    //@ts-ignore
    private createEntity(target: string): RemoteFile {
        const filepath = path.join(this.workspace, target)
        const stat = fs.statSync(filepath)
        const entity = new RemoteFile()
        entity.filepath = target
        entity.dirname = path.dirname(target)
        entity.extname = path.extname(filepath)
        entity.size = stat.size
        entity.createTime = stat.ctime
        entity.modifyTime = stat.mtime
        return entity
    }
}
