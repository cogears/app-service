///////////////////////////////////////////////////////////////////////////////
////  数据实体定义                                                           ////
///////////////////////////////////////////////////////////////////////////////
import { Class } from "./lang";

export type MysqlConfig = {
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
}

export type DataSchema<T> = {
    name: string,
    fields: DataField[],
    writable: boolean,
    entityClass?: Class<T>,
}
export type DataSchemaOptions = {
    writable: boolean,
}

export type DataField = { name: string } & DataFieldOptions;
export type DataFieldOptions = {
    type: DataFieldType;
    auto?: boolean;         // 自增/当前时间
    update?: boolean;       // 更新时间
    len?: number;
    m?: number;
    d?: number;
}

export type DataFieldType = "int" | "string" | "boolean" | "text" | "timestamp" | "datetime" | "decimal" | "double";

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
}

export interface Specification<T> {
    (criteriaBuilder: CriteriaBuilder, subject: EntitySubject<T>): string;
}

export interface CriteriaBuilder {
    and(left: string, right: string): string;

    or(left: string, right: string): string;
}

export type EntitySubject<T> = {
    [index in keyof T]: EntityFieldPredicate;
}

export interface EntityFieldPredicate {
    equal(value: any): string;

    between(min: any, max: any): string;

    lessThan(value: any): string;

    greaterThan(value: any): string;

    isNull(): string;

    isNotNull(): string;

    notNull(): string;

    like(value: any): string;

    notLike(value: any): string;

    not(value: any): string;

    in(value: any): string;

    notIn(value: any): string;
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
export function entity(options?: any): Function
export function id(options: DataFieldOptions): Function;
export function column(options: DataFieldOptions): Function;
export function repository(entityClass: Class<any>): Function
export function sql(sql?: string): Function;