import TaskContext from "../core/task/TaskContext.js";
export { DataFieldOptions, DataSchema, DataSchemaOptions, storage, getRegisterSchemas } from './decorate.js';

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

export class Repository<T> {
    /** @internal */
    private context: TaskContext;
    /** @internal */
    constructor(context: TaskContext) {
        this.context = context;
    }

    async insert(entity: T): Promise<T> { return entity }

    async update(entity: T): Promise<T> { return entity }

    async save(entity: T): Promise<T> { return entity }

    async delete(key: any): Promise<void> { }

    async clear(): Promise<void> { }

    async get(key: any): Promise<T | undefined> { return }

    async select(specification?: Specification<T>, pageRequest?: PageRequest): Promise<T[]> { return [] }

    async count(specification?: Specification<T>): Promise<number> { return 0 }

    generateRepeat(): RepeatSql<T> { return undefined as any }
    async submitRepeat(repeat: RepeatSql<T>): Promise<void> { }
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
