import { DataField } from "../decorate.js";
/** @internal */
export function int(field: DataField, isPrimaryKey: boolean = false): string {
    if (isPrimaryKey && field.auto) {
        return `\`${field.name}\` INT(11) NOT NULL AUTO_INCREMENT`;
    } else {
        return `\`${field.name}\` INT(11) ${field.canBeNull ? '' : 'NOT NULL'} DEFAULT 0`;
    }
}
/** @internal */
export function bigint(field: DataField, isPrimaryKey: boolean = false): string {
    if (isPrimaryKey && field.auto) {
        return `\`${field.name}\` BIGINT(20) NOT NULL AUTO_INCREMENT`;
    } else {
        return `\`${field.name}\` BIGINT(20) ${field.canBeNull ? '' : 'NOT NULL'} DEFAULT 0`;
    }
}
/** @internal */
export function string(field: DataField, isPrimaryKey: boolean = false): string {
    let len = field.len || 32;
    if (isPrimaryKey) {
        return `\`${field.name}\` VARCHAR(${len}) COLLATE utf8mb4_unicode_ci NOT NULL`;
    } else {
        return `\`${field.name}\` VARCHAR(${len}) COLLATE utf8mb4_unicode_ci DEFAULT NULL`;
    }
}
/** @internal */
export function boolean(field: DataField): string {
    return `\`${field.name}\` TINYINT(2) NOT NULL DEFAULT 0`;
}
/** @internal */
export function text(field: DataField): string {
    return `\`${field.name}\` TEXT COLLATE utf8mb4_unicode_ci`;
}
/** @internal */
export function datetime(field: DataField): string {
    if (field.update) {
        return `\`${field.name}\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`;
    }
    if (field.auto) {
        return `\`${field.name}\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`;
    }
    return `\`${field.name}\` DATETIME NULL DEFAULT NULL`;
}
/** @internal */
export function decimal(field: DataField): string {
    let m = field.m || 10;
    let d = field.d || 0;
    return `\`${field.name}\` DECIMAL(${m}, ${d}) ${field.canBeNull ? '' : 'NOT NULL'} DEFAULT 0`;
}
/** @internal */
export function double(field: DataField): string {
    let m = field.m || 10;
    let d = field.d || 0;
    return `\`${field.name}\` DOUBLE(${m}, ${d}) ${field.canBeNull ? '' : 'NOT NULL'} DEFAULT 0`;
}
