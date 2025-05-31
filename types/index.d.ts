export * from './common';
export * from './http';
export * from './lang';
export * from './storage';
import { Task, TaskHandle } from './common';
import { HttpConfig, HttpManager } from './http';
import { MysqlConfig } from './storage';

export default class AppContext {
    installLog(logPath?: string): void;
    installStorage(config: MysqlConfig): Promise<any>;
    installHttp(config: HttpConfig): HttpManager;
    schedule(task: Task, delay?: number): TaskHandle;
    schedulePeriodTask(task: Task, period: number): TaskHandle;
    startupRemoteShell(routePath?: string): void;
    dispose(): void;
}