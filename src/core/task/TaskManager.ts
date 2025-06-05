import InternalContext from '../InternalContext.js';
import { Task } from './index.js';
import TaskContext from "./TaskContext.js";
import TaskHandle from "./TaskHandle.js";
/** @internal */
export default class TaskManager {
    private readonly context: InternalContext;
    private readonly taskList: TaskWorker[] = [];
    private running: boolean = true;

    constructor(context: InternalContext) {
        this.context = context;
    }

    private activate(task: TaskWorker) {
        if (this.running && this.context.ready) {
            this.taskList.push(task);
            this.notify();
        }
    }

    notify() {
        if (this.context.ready) {
            if (this.taskList.length > 0) {
                const task = this.taskList.shift();
                task && this.executeTask(task);
            }
        }
    }

    private async executeTask(worker: TaskWorker) {
        if (worker.handle.isValid()) {
            const context = new TaskContext(this);
            try {
                await context.beginTransaction();
                await worker.task(context);
                await context.commit();
                worker.handle.dispatch(TaskHandle.SUCCESS)
            } catch (e: any) {
                console.error(e.stack);
                await context.fallback();
                worker.handle.dispatch(TaskHandle.FAIL)
            } finally {
                await context.dispose();
                worker.handle.dispatch(TaskHandle.COMPLETE)
            }
        }
    }

    getStorage(name?: string) {
        return this.context.getStorage(name)
    }

    schedule(task: Task, delay: number = 0): TaskHandle {
        if (!this.running) {
            throw new Error('任务管理器已停止运行')
        }
        const handle = new TaskHandle(setTimeout(() => {
            this.activate(new TaskWorker(task, handle))
        }, delay))
        return handle
    }

    schedulePeriodTask(task: Task, period: number): TaskHandle {
        if (!this.running) {
            throw new Error('任务管理器已停止运行')
        }
        const handle = new TaskHandle(setInterval(() => {
            this.activate(new TaskWorker(task, handle))
        }, period))
        return handle
    }

    dispose() {
        this.running = false;
        this.taskList.splice(0, this.taskList.length);
    }
}

class TaskWorker {
    readonly task: Task
    readonly handle: TaskHandle
    constructor(task: Task, handle: TaskHandle) {
        this.task = task
        this.handle = handle
    }
}