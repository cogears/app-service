import { HttpConfig, HttpTask } from "./core/http/index.js";
import InternalContext from "./core/InternalContext.js";
import { Task } from "./core/task/index.js";
import TaskHandle from "./core/task/TaskHandle.js";
import { Class } from "./lang.js";
import { ShellServer } from "./remote-shell/index.js";
import { startup } from "./remote-shell/startup.js";
import { MysqlConfig } from "./storage/index.js";

export default class AppContext {
    /** @internal */
    private instance: InternalContext

    shell?: ShellServer
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
    registerHttpUpload(path: string, directory: string, task: Class<HttpTask>): void {
        this.instance.registerHttpUpload(path, directory, task)
    }
    registerHttpStatic(path: string, directory: string): void {
        this.instance.registerHttpStatic(path, directory)
    }
    schedule(task: Task, delay?: number): TaskHandle {
        return this.instance.schedule(task, delay)
    }
    schedulePeriodTask(task: Task, period: number): TaskHandle {
        return this.instance.schedulePeriodTask(task, period)
    }

    startupRemoteShell(workspace: string, routePath: string = '/'): ShellServer {
        this.shell = startup(this, workspace, routePath)
        return this.shell
    }

    dispose(): void {
        this.instance.dispose()
    }
}
