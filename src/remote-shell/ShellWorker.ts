import { TaskContext } from "../core/task/index.js";

interface Job {
    (context: TaskContext, data: any): Promise<any>
}

export class ShellWorker {
    [index: string]: Job;
}