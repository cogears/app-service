export type Class<T> = { new(...args: Array<any>): T, [index: string]: any };
export type Method = (...args: Array<any>) => any;