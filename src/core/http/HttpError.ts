export class HttpError extends Error {
    readonly code: number
    constructor(code: number, message: string) {
        super(`[${code}]` + message)
        this.code = code
    }
}