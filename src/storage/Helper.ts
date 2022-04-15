import { CriteriaBuilder, EntityFieldPredicate } from "types";

export const criteriaBuilder: CriteriaBuilder = {
    and(left: string, right: string): string {
        return `(${left} AND ${right})`;
    },
    or(left: string, right: string): string {
        return `(${left} OR ${right})`;
    }
};

export const predicates: EntityFieldPredicate = {
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