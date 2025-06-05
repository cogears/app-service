import { HttpConfig, HttpTask } from "./core/http/index.js";
import InternalContext from "./core/InternalContext.js";
import { Task } from "./core/task/index.js";
import TaskHandle from "./core/task/TaskHandle.js";
import { Class } from "./lang.js";
import { startup } from "./remote-shell/index.js";
import { MysqlConfig } from "./storage/index.js";

export default abstract class AppContext {
    static startup(): AppContext {
        return new InternalContext()
    }

    abstract installLog(logPath?: string): void;
    abstract installStorage(config: MysqlConfig): Promise<any>;
    abstract installHttp(config: HttpConfig): Promise<any>;
    abstract registerHttpRoutes(path: string, tasks: Class<HttpTask>[]): void
    abstract schedule(task: Task, delay?: number): TaskHandle;
    abstract schedulePeriodTask(task: Task, period: number): TaskHandle;

    startupRemoteShell(routePath: string = '/') {
        startup(this, routePath)
    }

    dispose(): void {
    }
}
