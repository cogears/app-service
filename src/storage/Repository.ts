import { TaskContext } from "types";

export default class Repository<T> {
    private context: TaskContext;

    constructor(context: TaskContext) {
        this.context = context;
    }
}