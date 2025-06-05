import { HttpConfig, HttpTask } from "./core/http/index.js";
import InternalContext from "./core/InternalContext.js";
import { Task } from "./core/task/index.js";
import TaskHandle from "./core/task/TaskHandle.js";
import { Class } from "./lang.js";
import { startup } from "./remote-shell/index.js";
import { MysqlConfig } from "./storage/index.js";

export default class AppContext {
    /** @internal */
    private instance: InternalContext
    /** @internal */
    constructor() {
        this.instance = new InternalContext()
    }

    installLog(logPath?: string): void {
        this.instance.installLog(logPath)
    }
    installStorage(config: MysqlConfig): Promise<any> {
        return this.instance.installStorage(config)
    }
    installHttp(config: HttpConfig): Promise<any> {
        return this.instance.installHttp(config)
    }
    registerHttpRoutes(path: string, tasks: Class<HttpTask>[]): void {
        this.instance.registerHttpRoutes(path, tasks)
    }
    schedule(task: Task, delay?: number): TaskHandle {
        return this.schedule(task, delay)
    }
    schedulePeriodTask(task: Task, period: number): TaskHandle {
        return this.schedulePeriodTask(task, period)
    }

    startupRemoteShell(routePath: string = '/') {
        startup(this, routePath)
    }

    dispose(): void {
    }
}
