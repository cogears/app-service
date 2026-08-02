import HttpError from "../../core/http/HttpError.js";
import TaskContext from "../../core/task/TaskContext.js";
import { DataSchema, Specification } from "../../storage/index.js";
import { ShellWorker } from "../ShellWorker.js";

export class StorageWorker extends ShellWorker {
    async createTable(context: TaskContext, data: DataSchema<any>) {
        data.writable = true
        await context.getStorage(data.storage).createRepository(data)
    }

    async clearTable(context: TaskContext, { table }: any) {
        await context.getStorageRepository(table).clear()
    }

    async insertData(context: TaskContext, { table, data }: any) {
        return await context.getStorageRepository(table).insert(data)
    }

    async updateData(context: TaskContext, { table, data }: any) {
        await context.getStorageRepository(table).update(data)
    }

    async saveData(context: TaskContext, { table, data }: any) {
        await context.getStorageRepository(table).save(data)
    }

    async deleteData(context: TaskContext, { table, key }: any) {
        await context.getStorageRepository(table).delete(key)
    }

    async getData(context: TaskContext, { table, key }: any) {
        let data = await context.getStorageRepository(table).get(key)
        if (data) {
            return data
        }
        throw new HttpError(404, 'not found')
    }

    async selectData(context: TaskContext, { table, pageRequest, query }: any) {
        const repository = context.getStorageRepository(table)
        let specification: Specification<any> | undefined = undefined
        if (query) {
            specification = function (criteriaBuilder, subject) {
                let buff = criteriaBuilder.blank()
                for (let k in query) {
                    buff = criteriaBuilder.and(buff, subject[k].equal(query[k]))
                }
                return buff
            }
        }
        let list = await repository.select(specification, pageRequest)
        let total = await repository.count(specification)
        return { total, list }
    }
}
