import { EventDispatcher } from "../../common";
import { TaskHandle as ITaskHandle, Task } from "types";

export default class TaskHandle extends EventDispatcher implements ITaskHandle {
    static readonly COMPLETE: string = 'complete'
    private timer!: NodeJS.Timer;
    private isPeriod!: boolean;
    private valid: boolean = true
    readonly task: Task;

    constructor(task: Task) {
        super()
        this.task = task
    }

    setTimer(timer: NodeJS.Timer, isPeriod: boolean) {
        this.timer = timer
        this.isPeriod = isPeriod
    }

    isValid() {
        return this.valid
    }

    cancel() {
        this.valid = false
        if (this.isPeriod) {
            clearInterval(this.timer);
        } else {
            clearTimeout(this.timer);
        }
    }
}