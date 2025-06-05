import TaskContext from "../core/task/TaskContext.js";
export { DataFieldOptions, DataSchema, DataSchemaOptions, storage } from './decorate.js';

export type MysqlConfig = {
    name: string;
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number,
    queueLimit?: number,
}

export abstract class Repository<T> {
    /** @internal */
    private context: TaskContext;
    /** @internal */
    constructor(context: TaskContext) {
        this.context = context;
    }

    abstract insert(entity: T): Promise<T>;

    abstract update(entity: T): Promise<T>;

    abstract save(entity: T): Promise<T>;

    abstract delete(key: any): Promise<void>;

    abstract clear(): Promise<void>;

    abstract get(key: any): Promise<T | undefined>;

    abstract select(specification?: Specification<T>, pageRequest?: PageRequest): Promise<T[]>;

    abstract count(specification?: Specification<T>): Promise<number>;

    abstract generateRepeat(): RepeatSql<T>;
    abstract submitRepeat(repeat: RepeatSql<T>): Promise<void>;
}

export interface Specification<T> {
    (criteriaBuilder: CriteriaBuilder, subject: EntitySubject<T>): CriteriaBuffer;
}

export interface CriteriaBuilder {
    blank(): CriteriaBuffer;

    and(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;

    or(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;
}

export type EntitySubject<T> = {
    [index in keyof T]: EntityFieldPredicate;
}

export interface EntityFieldPredicate {
    equal(value: any): CriteriaBuffer;

    between(min: any, max: any): CriteriaBuffer;

    lessThan(value: any, equal?: boolean): CriteriaBuffer;

    greaterThan(value: any, equal?: boolean): CriteriaBuffer;

    isNull(): CriteriaBuffer;

    isNotNull(): CriteriaBuffer;

    notNull(): CriteriaBuffer;

    like(value: any): CriteriaBuffer;

    notLike(value: any): CriteriaBuffer;

    not(value: any): CriteriaBuffer;

    in(value: any): CriteriaBuffer;

    notIn(value: any): CriteriaBuffer;
}

export interface CriteriaBuffer {
}

export interface RepeatSql<T> {
    bufferSize: number;
    push(entity: T): boolean;
}

export interface PageRequest {
    page: number;
    size: number;
    orders?: PageOrder[];
    fields?: string[];
}

export interface PageOrder {
    name: string;
    asc: boolean;
}

export interface PageResult<T> {
    total: number;
    page: number;
    size: number;
    list: T[];
}
