import fs from 'fs';
import path from 'path';
import HttpError from '../../core/http/HttpError.js';
import TaskContext from '../../core/task/TaskContext.js';
import { ShellWorker } from '../ShellWorker.js';

/** @internal */
export class FileWorker extends ShellWorker {
    //@ts-ignore
    private readonly workspace: string
    constructor(workspace: string) {
        super()
        this.workspace = workspace
    }

    async mkdir(_context: TaskContext, { target }: any) {
        const filepath = path.resolve(this.workspace, target)
        fs.mkdirSync(filepath, { recursive: true })
    }

    async ls(_context: TaskContext, { target }: any) {
        const filepath = path.resolve(this.workspace, target)
        if (!fs.existsSync(filepath)) {
            throw new HttpError(404, 'target not found: ' + target)
        }
        if (fs.statSync(filepath).isDirectory()) {
            return fs.readdirSync(filepath)
        } else {
            return [path.basename(filepath)]
        }
    }

    async cp(_context: TaskContext, { source, target }: any) {
        const filepath1 = path.resolve(this.workspace, source)
        const filepath2 = path.resolve(this.workspace, target)
        if (!fs.existsSync(filepath1)) {
            throw new HttpError(404, 'source not found: ' + source)
        }
        if (fs.existsSync(filepath2)) {
            throw new HttpError(403, 'target is existed: ' + target)
        }
        fs.mkdirSync(path.dirname(filepath2), { recursive: true })
        fs.cpSync(filepath1, filepath2)
    }

    async mv(_context: TaskContext, { source, target }: any) {
        this.rename(_context, { source, target })
    }

    async rename(_context: TaskContext, { source, target }: any) {
        const filepath1 = path.resolve(this.workspace, source)
        const filepath2 = path.resolve(this.workspace, target)
        if (!fs.existsSync(filepath1)) {
            throw new HttpError(404, 'source not found: ' + source)
        }
        if (fs.existsSync(filepath2)) {
            throw new HttpError(403, 'target is existed: ' + target)
        }
        fs.mkdirSync(path.dirname(filepath2), { recursive: true })
        fs.renameSync(filepath1, filepath2)
    }

    async read(_context: TaskContext, { target }: any) {
        const filepath = path.resolve(this.workspace, target)
        if (!fs.existsSync(filepath)) {
            throw new HttpError(404, 'target not found: ' + target)
        }
        if (fs.statSync(filepath).isDirectory()) {
            throw new HttpError(403, 'target is directory:' + target)
        }
        return fs.readFileSync(filepath, { encoding: 'utf8' })
    }

    async write(_context: TaskContext, { target, data }: any) {
        const filepath = path.resolve(this.workspace, target)
        if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
            throw new HttpError(403, 'target is directory:' + target)
        }
        fs.mkdirSync(path.dirname(filepath), { recursive: true })
        fs.writeFileSync(filepath, data, { encoding: 'utf8' })
    }

    async rm(_context: TaskContext, { target }: any) {
        const filepath = path.resolve(this.workspace, target)
        if (fs.existsSync(filepath)) {
            fs.rmSync(filepath)
        }
    }
}
