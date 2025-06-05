import EventDispatcher from "../../common/EventDispatcher.js";

export default class TaskHandle extends EventDispatcher {
    static readonly COMPLETE: string = 'complete'
    static readonly SUCCESS: string = 'success'
    static readonly FAIL: string = 'fail'
    /** @internal */
    private readonly timer: NodeJS.Timeout;
    /** @internal */
    private valid: boolean = true
    /** @internal */
    constructor(timer: NodeJS.Timeout) {
        super()
        this.timer = timer
    }

    isValid() {
        return this.valid
    }

    cancel() {
        this.valid = false
        this.timer.close()
    }
}