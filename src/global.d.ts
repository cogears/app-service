declare interface Class<T> {
    new(...args: any[]): T
    [index: string]: any
}

declare interface Method {
    (...args: Array<any>): any
}