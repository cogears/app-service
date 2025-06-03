import HttpClient from "@cogears/http-client";


export function generateClient(routePath: string = '/') {
    if (!routePath.endsWith('/')) {
        routePath += '/'
    }
    const http = new HttpClient()
    return function callRemote(command: string, data: any) {
        return http.post(`${routePath}${command}`, data)
    }
}
