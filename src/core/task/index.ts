import TaskContext from "./TaskContext.js";
import TaskHandle from "./TaskHandle.js";

export interface Task {
    (context: TaskContext): void;
}

export { TaskContext, TaskHandle };
