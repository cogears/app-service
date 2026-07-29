import { TaskContext } from "../core/task/index.js";

interface Job {
    (context: TaskContext, data: any): Promise<any>
}

export interface JobWorker {
    [index: string]: Job
}

/** @internal */
export class ShellWorker implements JobWorker {
    [index: string]: Job;
}