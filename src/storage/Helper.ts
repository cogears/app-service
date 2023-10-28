import { CriteriaBuilder, EntityFieldPredicate, CriteriaBuffer } from "types";

export class CriteriaBufferImpl implements CriteriaBuffer {
    private readonly content: string;
    private readonly left?: CriteriaBufferImpl
    private readonly right?: CriteriaBufferImpl

    constructor(content: string, left?: CriteriaBufferImpl, right?: CriteriaBufferImpl) {
        this.content = content
        this.left = left
        this.right = right
    }
}

export const criteriaBuilder: CriteriaBuilder = {
    and(left: CriteriaBufferImpl, right: CriteriaBufferImpl): CriteriaBufferImpl {
        return new CriteriaBufferImpl('AND', left, right)
    },
    or(left: CriteriaBufferImpl, right: CriteriaBufferImpl): CriteriaBufferImpl {
        return new CriteriaBufferImpl('OR', left, right)
    }
};

export const predicates = {
    equal(value: string): string {
        return ` = ${value === undefined ? '?' : value}`;
    },
    between(min: string, max: string): string {
        return ` BETWEEN ${min === undefined ? '?' : min} AND ${max === undefined ? '?' : max}`;
    },
    lessThan(value: string): string {
        return ` < ${value === undefined ? '?' : value}`;
    },
    greaterThan(value: string): string {
        return ` > ${value === undefined ? '?' : value}`;
    },
    isNull(): string {
        return ' IS NULL';
    },
    isNotNull(): string {
        return ' NOT NULL';
    },
    notNull(): string {
        return this.isNotNull();
    },
    like(value: string): string {
        return ` LIKE ${value === undefined ? '?' : value}`;
    },
    notLike(value: string): string {
        return ` NOT LIKE ${value === undefined ? '?' : value}`;
    },
    not(value: string): string {
        return ` <> ${value === undefined ? '?' : value}`;
    },
    in(value: string): string {
        return ` IN (${value === undefined ? '?' : value})`;
    },
    notIn(value: string): string {
        return ` NOT IN (${value === undefined ? '?' : value})`;
    }
};

for (const func of Object.values(predicates)) {
    let name = func.name;
    Reflect.defineProperty(func, 'name', {
        value: name[0].toUpperCase() + name.substr(1)
    });
}
