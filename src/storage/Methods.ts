import { StorageRepository } from ".";

export function getOneBy<T>(repository: StorageRepository<T>, where: string, argumentsLength: number) {
    return async function (...values: Array<any>): Promise<T | undefined> {
        // @ts-ignore
        let connection = await this.context.getStorageConnection();
        if (argumentsLength !== values.length) {
            throw new Error('参数错误');
        }
        let list = await repository.select(connection, where, undefined, values);
        return list.length > 0 ? list[0] : undefined;
    };
}

export function getCountBy<T>(repository: StorageRepository<T>, where: string, argumentsLength: number) {
    return async function (...values: Array<any>): Promise<any> {
        // @ts-ignore
        let connection = await this.context.getStorageConnection();
        if (argumentsLength !== values.length) {
            throw new Error('参数错误');
        }
        return await repository.count(connection, where, values);
    };
}

export function getAllBy<T>(repository: StorageRepository<T>, where: string, argumentsLength: number) {
    return async function (...values: Array<any>): Promise<T[]> {
        // @ts-ignore
        let connection = await this.context.getStorageConnection();
        if (argumentsLength !== values.length && argumentsLength !== values.length - 1) {
            throw new Error('参数错误');
        }
        let pageRequest = argumentsLength < values.length ? values.pop() : undefined;
        return await repository.select(connection, where, pageRequest, values);
    };
}

export function deleteBy<T>(repository: StorageRepository<T>, where: string, argumentsLength: number) {
    return async function (...values: Array<any>): Promise<any> {
        // @ts-ignore
        let connection = await this.context.getStorageConnection();
        if (argumentsLength !== values.length) {
            throw new Error('参数错误');
        }
        return await repository.delete(connection, where, values);
    };
}
