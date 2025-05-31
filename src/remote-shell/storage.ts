import { DataSchema, TaskContext } from "types";
import { HttpError } from "../core/http/HttpError";
import { saveStorage } from './index';

export async function create_table(context: TaskContext, data: DataSchema<any>) {
    data.writable = true
    saveStorage(data)
    await context.getStorage(data.storage).createRepository(data)
}

export async function clear_table(context: TaskContext, { table }: any) {
    await context.getStorageRepository(table).clear()
}

export async function insert_data(context: TaskContext, { table, data }: any) {
    return await context.getStorageRepository(table).insert(data)
}

export async function update_data(context: TaskContext, { table, data }: any) {
    await context.getStorageRepository(table).update(data)
}

export async function save_data(context: TaskContext, { table, data }: any) {
    await context.getStorageRepository(table).save(data)
}

export async function delete_data(context: TaskContext, { table, key }: any) {
    await context.getStorageRepository(table).delete(key)
}

export async function get_data(context: TaskContext, { table, key }: any) {
    let data = await context.getStorageRepository(table).get(key)
    if (data) {
        return data
    }
    throw new HttpError(404, 'not found')
}

export async function select_data(context: TaskContext, { table, pageRequest }: any) {
    return await context.getStorageRepository(table).select(undefined, pageRequest)
}