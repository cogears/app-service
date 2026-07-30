import fs from 'fs';
import path from 'path';
import HttpError from '../../core/http/HttpError.js';
import TaskContext from '../../core/task/TaskContext.js';
import { ShellWorker } from '../ShellWorker.js';
import { RemoteFile } from '../shell-client.js';

/** @internal */
export class FileWorker extends ShellWorker {
    //@ts-ignore
    private readonly workspace: string
    constructor(workspace: string) {
        super()
        this.workspace = workspace
    }

    async tree(_context: TaskContext) {
        return loadDir('', this.workspace)
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
            let files = fs.readdirSync(filepath)
            return files.map(file => getFileStat(path.join(filepath, file), this.workspace))
        } else {
            return [getFileStat(filepath, this.workspace)]
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
    }

    async rm(context: TaskContext, { target }: any) {
        const filepath = path.join(this.workspace, target)
        if (fs.existsSync(filepath)) {
            fs.rmSync(filepath)
        }
    }
}

function getFileStat(filepath: string, basedir: string): RemoteFile {
    const stat = fs.statSync(filepath)
    return {
        filepath: path.relative(basedir, filepath),
        name: path.basename(filepath),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        ctime: stat.ctimeMs,
        mtime: stat.mtimeMs,
        children: [],
    }
}

function loadDir(dirpath: string, basedir: string) {
    dirpath = path.join(basedir, dirpath)
    const dirs = fs.readdirSync(dirpath).map(file => getFileStat(path.join(dirpath, file), basedir)).filter(file => file.isDirectory)
    for (let dir of dirs) {
        dir.children = loadDir(dir.filepath, basedir)
    }
    return dirs
}