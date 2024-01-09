///////////////////////////////////////////////////////////////////////////////
////  数据实体定义                                                           ////
///////////////////////////////////////////////////////////////////////////////
import { Class } from "./lang";

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

export type DataSchema<T> = {
    name: string,
    fields: DataField[],
    writable: boolean,
    entityClass?: Class<T>,
    comment?: string,
    storage?: string,
}
export type DataSchemaOptions = {
    name?: string,
    writable?: boolean,
    comment?: string,
    storage?: string,
}

export type DataField = { name: string, alias: string, } & DataFieldOptions;
export type DataFieldOptions = {
    type: DataFieldType,
    name?: string,
    auto?: boolean,         // 自增/当前时间
    update?: boolean,       // 更新时间
    len?: number,
    m?: number,
    d?: number,
    comment?: string,
    canBeNull?: boolean,    // 是否可为空
}

export type DataFieldType = "int" | "bigint" | "string" | "boolean" | "text" | "timestamp" | "date" | "datetime" | "decimal" | "double";

///////////////////////////////////////////////////////////////////////////////
////  应用接口                                                              ////
///////////////////////////////////////////////////////////////////////////////
export class Repository<T> {
    insert(entity: T): Promise<T>;

    update(entity: T): Promise<T>;

    save(entity: T): Promise<T>;

    delete(key: any): Promise<void>;

    clear(): Promise<void>;

    get(key: any): Promise<T | undefined>;

    select(specification?: Specification<T>, pageRequest?: PageRequest): Promise<T[]>;

    count(specification?: Specification<T>): Promise<number>;

    generateRepeat(): RepeatSql<T>;
    submitRepeat(repeat: RepeatSql<T>): Promise<void>;
}

export interface RepeatSql<T> {
    bufferSize: number;
    push(entity: T): boolean;
}

export interface Specification<T> {
    (criteriaBuilder: CriteriaBuilder, subject: EntitySubject<T>): CriteriaBuffer;
}

export interface CriteriaBuilder {
    and(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;

    or(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer;
}

export type EntitySubject<T> = {
    [index in keyof T]: EntityFieldPredicate;
}

export interface EntityFieldPredicate {
    equal(value: any): CriteriaBuffer;

    between(min: any, max: any): CriteriaBuffer;

    lessThan(value: string, equal?: boolean): CriteriaBuffer;

    greaterThan(value: string, equal?: boolean): CriteriaBuffer;

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


///////////////////////////////////////////////////////////////////////////////
////  修饰器                                                              ////
///////////////////////////////////////////////////////////////////////////////
export function entity(options?: DataSchemaOptions): Function
export function id(options: DataFieldOptions): Function;
export function column(options: DataFieldOptions): Function;
export function repository(entityClass: Class<any>): Function
export function sql(sql?: string): Function;