import { escape } from "mysql";
import { DataField, DataSchema, PageOrder, PageRequest } from "types";
import * as MysqlField from "./MysqlField";

function getFieldDefine(field: DataField, isPrimaryKey: boolean = false) {
    let text = MysqlField[field.type](field, isPrimaryKey)
    if (field.comment) {
        text += ` COMMENT '${field.comment}'`
    }
    return text
}

class MysqlSqlGenerator {
    encode(value: any): string {
        return escape(value);
    }

    getCreate(schema: DataSchema<any>): string {
        let fields = schema.fields.map((field, index) => getFieldDefine(field, index == 0));
        fields.push(`PRIMARY KEY (\`${schema.fields[0].name}\`)`);
        let sql = `CREATE TABLE \`${schema.name}\` (${fields.join(',')}) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC`;
        if (schema.comment) {
            sql += ` COMMENT='${schema.comment}'`
        }
        return sql
    }

    getAlter(schema: DataSchema<any>, originFields: string[]): string {
        let diff = schema.fields.map((field, index) => {
            if (index > 0) {
                if (originFields.includes(field.name)) {
                    return 'MODIFY ' + getFieldDefine(field);
                } else {
                    return 'ADD ' + getFieldDefine(field);
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
            if (Reflect.has(entity, field.alias)) {
                if ((field.auto || field.update) && (entity[field.alias] == undefined || entity[field.alias] == null)) {
                    continue;
                }
                names.push(`\`${field.name}\``);
                values.push(this.encode(entity[field.alias]));
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
            if (Reflect.has(entity, field.alias)) {
                settings.push(`\`${field.name}\` = ${this.encode(entity[field.alias])}`);
            }
        }
        if (settings.length > 0) {
            let keyField = schema.fields[0]
            let value = this.encode(entity[keyField.alias]);
            return `UPDATE \`${schema.name}\` SET ${settings.join(',')} WHERE \`${keyField.name}\` = ${value}`;
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
            values.push(this.encode(entity[field.alias]));
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
            fields = pageRequest.fields
                .map(alias => schema.fields.find(field => field.alias == alias)?.name)
                .filter(name => name).join(',')
        }
        let order = (pageRequest && pageRequest.orders) ? getOrders(schema, pageRequest.orders) : false;
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

function getOrders(schema: DataSchema<any>, orders: PageOrder[]) {
    return orders.map(order => (
        {
            asc: order.asc,
            name: schema.fields.find(field => field.alias == order.name)?.name
        }
    ))
        .filter(item => item.name)
        .map(order => `\`${order.name}\` ${order.asc ? 'ASC' : 'DESC'}`).join(',');
}

export default new MysqlSqlGenerator()