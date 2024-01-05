import { Repository } from "./storage";

///////////////////////////////////////////////////////////////////////////////
////  事件接口                                                              ////
///////////////////////////////////////////////////////////////////////////////
export class EventDispatcher {
    addChild(child: EventDispatcher): void;
    removeChild(child: EventDispatcher): void;
    removeAllChildren(): void;
    addEventListener(eventNames: string, listener: EventListener): void;
    removeEventListener(eventNames: string, listener?: EventListener): void;
    removeAllEventListeners(): void;
    dispatch(event: string, ...args: Array<any>): void;
}

export interface EventListener {
    (event: string, ...args: Array<any>): void;
}

export function LogFactory(logPath?: string): void

///////////////////////////////////////////////////////////////////////////////
////  任务接口                                                              ////
///////////////////////////////////////////////////////////////////////////////
export interface TaskContext {
    getRepository(name: string, storage?: string): Repository<any>;

    schedule(task: Task, delay?: number): TaskHandle;

    schedulePeriodTask(task: Task, period: number): TaskHandle;
}

export interface TaskHandle {
    cancel(): void;
    addEventListener(event: 'complete', listener: EventListener): void;
}

export interface Task {
    (context: TaskContext): void;
}

