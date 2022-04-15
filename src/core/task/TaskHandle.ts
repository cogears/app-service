import { TaskHandle as ITaskHandle } from "types";

export default class TaskHandle implements ITaskHandle {
    private readonly instance: NodeJS.Timer;
    private readonly isPeriod: boolean;

    constructor(instance: NodeJS.Timer, isPeriod: boolean) {
        this.instance = instance;
        this.isPeriod = isPeriod;
    }

    cancel() {
        if (this.isPeriod) {
            clearInterval(this.instance);
        } else {
            clearTimeout(this.instance);
        }
    }
}