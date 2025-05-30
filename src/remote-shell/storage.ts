import { DataSchema, TaskContext } from "types";

export async function create_table(context: TaskContext, data: DataSchema<any>) {
    await context.getStorage(data.storage).createRepository(data)
}

export async function clear_table(context: TaskContext, { storage }: any) {
    await context.getStorageRepository(storage).clear()
}

export async function insert_data(context: TaskContext, { storage, data }: any) {
    return await context.getStorageRepository(storage).insert(data)
}

export async function update_data(context: TaskContext, { storage, data }: any) {
    await context.getStorageRepository(storage).update(data)
}

export async function save_data(context: TaskContext, { storage, data }: any) {
    await context.getStorageRepository(storage).save(data)
}

export async function delete_data(context: TaskContext, { storage, key }: any) {
    await context.getStorageRepository(storage).delete(key)
}

export async function get_data(context: TaskContext, { storage, key }: any) {
    return await context.getStorageRepository(storage).get(key)
}

export async function select_data(context: TaskContext, { storage, pageRequest }: any) {
    return await context.getStorageRepository(storage).select(undefined, pageRequest)
}