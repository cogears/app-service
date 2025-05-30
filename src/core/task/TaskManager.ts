import { Task } from "types";
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

    notify() {
        if (this.context.ready) {
            if (this.taskList.length > 0) {
                let task = this.taskList.shift();
                task && this.execute(task);
            }
        }
    }

    private async execute(taskHandle: TaskHandle) {
        if (taskHandle.isValid()) {
            let context = new TaskContext(this);
            try {
                await context.beginTransaction();
                await taskHandle.task(context);
                await context.commit();
            } catch (e: any) {
                console.error(e.stack);
                await context.fallback();
            } finally {
                await context.dispose();
                taskHandle.dispatch(TaskHandle.COMPLETE)
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
        let instance = setInterval(() => {
            if (this.context.ready) {
                this.activate(taskHandle)
            }
        }, period);
        taskHandle.setTimer(instance, true)
        return taskHandle
    }

    dispose() {
        this.running = false;
        this.taskList.splice(0, this.taskList.length);
    }
}

