import * as fs from 'fs';
import * as path from 'path';
import { TaskContext } from "types";
import { HttpError } from '../core/http/HttpError';
import { USER_PATH } from "./config";

const CURR_PATH = path.resolve(USER_PATH, 'files')

export async function mkdir(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    fs.mkdirSync(filepath, { recursive: true })
}

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

export async function mv(_context: TaskContext, { source, target }: any) {
    await rename(_context, { source, target })
}

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

export async function write(_context: TaskContext, { target, data }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (fs.existsSync(filepath) && fs.statSync(filepath).isDirectory()) {
        throw new HttpError(403, 'target is directory:' + target)
    }
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, data, { encoding: 'utf8' })
}

export async function rm(_context: TaskContext, { target }: any) {
    const filepath = path.resolve(CURR_PATH, target)
    if (fs.existsSync(filepath)) {
        fs.rmSync(filepath)
    }
}