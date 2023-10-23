import { Repository, Task } from "types";
import { StorageConnection } from '../../storage';
import InternalContext from '../InternalContext';
import TaskContext from "./TaskContext";
import TaskHandle from "./TaskHandle";

export default class TaskManager {
    private readonly context: InternalContext;
    private readonly taskList: TaskHandle[] = [];
    private running: boolean = true;

    constructor(context: InternalContext) {
        this.context = context;
    }

    private activate(task: TaskHandle) {
        if (this.running) {
            this.taskList.push(task);
            this.notify();
        }
    }

    private notify() {
        if (this.taskList.length > 0) {
            let task = this.taskList.shift();
            task && this.execute(task);
        }
    }

    private async execute(taskHandle: TaskHandle) {
        if (taskHandle.isValid()) {
            let context = new TaskContext(this);
            try {
                await context.beginTransaction();
                await taskHandle.task(context);
                await context.commit();
            } catch (e) {
                console.error(e);
                await context.fallback();
            } finally {
                await context.dispose();
                taskHandle.dispatch(TaskHandle.COMPLETE)
            }
        }
    }

    getStorageConnection(): Promise<StorageConnection> {
        return this.context.storage.getConnection()
    }

    getRepository(context: TaskContext, name: string): Repository<any> {
        let schema = this.context.storage.getSchema(name)
        return new schema.repositoryClass(context);
    }

    schedule(task: Task, delay: number = 0): TaskHandle {
        if (!this.running) {
            throw new Error('任务管理器已停止运行')
        }
        let taskHandle = new TaskHandle(task)
        let instance = setTimeout(this.activate.bind(this, taskHandle), delay);
        taskHandle.setTimer(instance, false)
        return taskHandle
    }

    schedulePeriodTask(task: Task, period: number): TaskHandle {
        if (!this.running) {
            throw new Error('任务管理器已停止运行')
        }
        let taskHandle = new TaskHandle(task)
        let instance = setInterval(this.activate.bind(this, taskHandle), period);
        taskHandle.setTimer(instance, true)
        return taskHandle
    }

    dispose() {
        this.running = false;
        this.taskList.splice(0, this.taskList.length);
    }
}