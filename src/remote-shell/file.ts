import fs from 'fs';
import path from 'path';
import HttpError from '../core/http/HttpError.js';
import TaskContext from '../core/task/TaskContext.js';
import { USER_PATH } from "./config.js";

const CURR_PATH = path.resolve(USER_PATH, 'files')
/** @internal */
export async function mkdir(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    fs.mkdirSync(filepath, { recursive: true })
}
/** @internal */
export async function ls(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (!fs.existsSync(filepath)) {
        throw new HttpError(404, 'target not found: ' + target)
    }
    if (fs.statSync(filepath).isDirectory()) {
        return fs.readdirSync(filepath)
    } else {
        return [path.basename(filepath)]
    }
}
/** @internal */
export async function cp(_context: TaskContext, { source, target }: any) {
    const filepath1 = path.resolve(CURR_PATH, source)
    const filepath2 = path.resolve(CURR_PATH, target)
    if (!fs.existsSync(filepath1)) {
        throw new HttpError(404, 'source not found: ' + source)
    }
    if (fs.existsSync(filepath2)) {
        throw new HttpError(403, 'target is existed: ' + target)
    }
    fs.mkdirSync(path.dirname(filepath2), { recursive: true })
    fs.cpSync(filepath1, filepath2)
}
/** @internal */
export async function mv(_context: TaskContext, { source, target }: any) {
    await rename(_context, { source, target })
}
/** @internal */
export async function rename(_context: TaskContext, { source, target }: any) {
    const filepath1 = path.resolve(CURR_PATH, source)
    const filepath2 = path.resolve(CURR_PATH, target)
    if (!fs.existsSync(filepath1)) {
        throw new HttpError(404, 'source not found: ' + source)
    }
    if (fs.existsSync(filepath2)) {
        throw new HttpError(403, 'target is existed: ' + target)
    }
    fs.mkdirSync(path.dirname(filepath2), { recursive: true })
    fs.renameSync(filepath1, filepath2)
}
/** @internal */
export async function read(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (!fs.existsSync(filepath)) {
        throw new HttpError(404, 'target not found: ' + target)
    }
    if (fs.statSync(filepath).isDirectory()) {
        throw new HttpError(403, 'target is directory:' + target)
    }
    return fs.readFileSync(filepath, { encoding: 'utf8' })
}
/** @internal */
export async function write(_context: TaskContext, { target, data }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
        throw new HttpError(403, 'target is directory:' + target)
    }
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, data, { encoding: 'utf8' })
}
/** @internal */
export async function rm(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (fs.existsSync(filepath)) {
        fs.rmSync(filepath)
    }
}