import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import TaskContext from "types";

const USER_PATH = path.resolve(os.homedir(), 'cogears')

export function mkdir(context: TaskContext, { target }: any) {
    const filepath = path.resolve(USER_PATH, target)
    fs.mkdirSync(filepath, { recursive: true })
}

export function create_file() {

}