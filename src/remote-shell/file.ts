import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TaskContext } from "types";

const USER_PATH = path.resolve(os.homedir(), 'cogears')

export async function mkdir(context: TaskContext, { target }: any) {
    const filepath = path.resolve(USER_PATH, target)
    fs.mkdirSync(filepath, { recursive: true })
}

export async function load_file(context: TaskContext, { target }: any) {
    const filepath = path.resolve(USER_PATH, target)
    return fs.readFileSync(filepath, { encoding: 'utf8' })
}

export async function write_file(context: TaskContext, { target, data }: any) {
    const filepath = path.resolve(USER_PATH, target)
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, data, { encoding: 'utf8' })
}

export async function delete_file(context: TaskContext, { target }: any) {
    const filepath = path.resolve(USER_PATH, target)
    fs.rmSync(filepath)
}