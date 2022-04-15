export * from './common';
export * from './lang';
export * from './storage';
import { Task } from './common';
import { MysqlConfig } from './storage';

export default class AppContext {
    installStorage(config: MysqlConfig): Promise<any>;
    start(task: Task): void;
}