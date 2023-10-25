import { escape } from "mysql";
import { DataField, DataSchema, PageOrder, PageRequest } from "types";
import * as MysqlField from "./MysqlField";

class MysqlSqlGenerator {
    encode(value: any): string {
        return escape(value);
    }

    getCreate(schema: DataSchema<any>): string {
        let fields = schema.fields.map((field, index) => MysqlField[field.type](field, index == 0));
        fields.push(`PRIMARY KEY (\`${schema.fields[0].name}\`)`);
        return `CREATE TABLE \`${schema.name}\` (${fields.join(',')}) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC`;
    }

    getAlter(schema: DataSchema<any>, originFields: string[]): string {
        let diff = schema.fields.map((field, index) => {
            if (index > 0) {
                if (originFields.includes(field.name)) {
                    return 'MODIFY ' + MysqlField[field.type](field);
                } else {
                    return 'ADD ' + MysqlField[field.type](field);
                }
            }
        });
        diff.shift();
        return `ALTER TABLE \`${schema.name}\` ${diff.join(',')}`;
    }

    getInsert(schema: DataSchema<any>, entity: any) {
        let names: string[] = [];
        let values: string[] = [];
        for (let i = 0; i < schema.fields.length; i++) {
            let field: DataField = schema.fields[i];
            if (Reflect.has(entity, field.name)) {
                if ((field.auto || field.update) && (entity[field.name] == undefined || entity[field.name] == null)) {
                    continue;
                }
                names.push(`\`${field.name}\``);
                values.push(this.encode(entity[field.name]));
            }
        }
        let sql = `INSERT INTO \`${schema.name}\``;
        if (names.length > 0) {
            sql += ` (${names.join(',')}) VALUES (${values.join(',')})`;
        }
        return sql;
    }

    getUpdate(schema: DataSchema<any>, entity: any): string | undefined {
        let settings = [];
        for (let i = 1; i < schema.fields.length; i++) {
            let field: DataField = schema.fields[i];
            if (field.auto || field.update) {
                continue;
            }
            if (Reflect.has(entity, field.name)) {
                settings.push(`\`${field.name}\` = ${this.encode(entity[field.name])}`);
            }
        }
        if (settings.length > 0) {
            let key = schema.fields[0].name;
            let value = this.encode(entity[key]);
            return `UPDATE \`${schema.name}\` SET ${settings.join(',')} WHERE \`${key}\` = ${value}`;
        }
    }

    getSave(schema: DataSchema<any>, entity: any): string {
        let insertSql = this.getInsert(schema, entity);
        let updateSql = this.getUpdate(schema, entity);
        if (updateSql) {
            let from = updateSql.indexOf('SET ') + 4;
            let to = updateSql.lastIndexOf(' WHERE');
            return insertSql + ' ON DUPLICATE KEY UPDATE ' + updateSql.substring(from, to);
        }
        return insertSql;
    }

    getReplace(schema: DataSchema<any>): string {
        let names: string[] = [];
        for (let i = 0; i < schema.fields.length; i++) {
            let field: DataField = schema.fields[i];
            if (field.auto || field.update) {
                continue;
            }
            names.push(`\`${field.name}\``);
        }
        let sql = `REPLACE INTO \`${schema.name}\``;
        if (names.length > 0) {
            sql += ` (${names.join(',')}) VALUES `;
        }
        return sql;
    }

    getReplaceValue(schema: DataSchema<any>, entity: any): string {
        let values: string[] = [];
        for (let i = 0; i < schema.fields.length; i++) {
            let field: DataField = schema.fields[i];
            if (field.auto || field.update) {
                continue;
            }
            values.push(this.encode(entity[field.name]));
        }
        return `(${values.join(',')})`;
    }

    getDelete(schema: DataSchema<any>, where?: string): string {
        let sql = `DELETE FROM \`${schema.name}\``;
        if (where) {
            sql += ` WHERE ${where}`;
        }
        return sql;
    }

    getCount(schema: DataSchema<any>, where?: string) {
        let key = schema.fields[0].name;
        let sql = `SELECT COUNT(\`${key}\`) as value FROM \`${schema.name}\``;
        if (where) {
            sql += ` WHERE ${where}`;
        }
        return sql;
    }

    getSelect(schema: DataSchema<any>, where: string, pageRequest?: PageRequest): string {
        let fields = '*';
        if (pageRequest && pageRequest.fields) {
            fields = pageRequest.fields.join(',');
        }
        let order = (pageRequest && pageRequest.orders) ? getOrders(pageRequest.orders) : false;
        let sql = `FROM \`${schema.name}\``;
        if (where) {
            sql += ' WHERE ' + where;
        }
        if (order) {
            sql += ' ORDER BY ' + order;
        }
        if (pageRequest && pageRequest.size) {
            if (!pageRequest.page) {
                pageRequest.page = 0;
            }
            let primaryKey = schema.fields[0].name;
            sql = `SELECT \`${primaryKey}\` ${sql} LIMIT ${pageRequest.page * pageRequest.size}, ${pageRequest.size}`;
            sql = `SELECT ${fields} FROM \`${schema.name}\` WHERE \`${primaryKey}\` IN (SELECT \`${primaryKey}\` FROM (${sql}) AS tt)`;
            if (order) {
                sql += ' ORDER BY ' + order;
            }
        } else {
            sql = `SELECT ${fields} ${sql}`;
        }
        return sql;
    }
}

function getOrders(orders: PageOrder[]) {
    return orders.map(order => `\`${order.name}\` ${order.asc ? 'ASC' : 'DESC'}`).join(',');
}

export default new MysqlSqlGenerator()