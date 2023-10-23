export * from './common';
export * from './lang';
export * from './storage';
import { Task, TaskHandle } from './common';
import { MysqlConfig } from './storage';

export default class AppContext {
    installStorage(config: MysqlConfig): Promise<any>;
    schedule(task: Task, delay?: number): TaskHandle;
    schedulePeriodTask(task: Task, period: number): TaskHandle;
    dispose(): void;
}