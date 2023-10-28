import { CriteriaBuffer, CriteriaBuilder } from "types";

export class CriteriaConnector implements CriteriaBuffer {
    private readonly connector: string;
    private readonly left: CriteriaBuffer
    private readonly right: CriteriaBuffer

    constructor(connector: string, left: CriteriaBuffer, right: CriteriaBuffer) {
        this.connector = connector
        this.left = left
        this.right = right
    }

    toString() {
        return '(' + this.left.toString() + ' ' + this.connector + ' ' + this.right.toString() + ')'
    }
}

export class CriteriaCondition implements CriteriaBuffer {
    private readonly content: string;
    constructor(content: string) {
        this.content = content
    }

    toString() {
        return this.content
    }
}

export const criteriaBuilder: CriteriaBuilder = {
    and(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer {
        return new CriteriaConnector('AND', left, right)
    },
    or(left: CriteriaBuffer, right: CriteriaBuffer): CriteriaBuffer {
        return new CriteriaConnector('OR', left, right)
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
