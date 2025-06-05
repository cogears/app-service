export interface Class<T> {
    new(...args: any[]): T
    [index: string]: any
}

export interface Method {
    (...args: Array<any>): any
}