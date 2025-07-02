import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { Class } from '../../lang.js';
import InternalContext from "../InternalContext.js";
import TaskContext from '../task/TaskContext.js';
import { ApiField, ApiInfo, apis } from './decorate.js';
import HttpError from './HttpError.js';
import { HttpConfig, HttpTask } from './index.js';

/** @internal */
export default class HttpManager {
    private readonly context: InternalContext
    private readonly server: express.Express

    constructor(context: InternalContext) {
        this.context = context;
        this.server = express()
    }

    startup(config: HttpConfig): Promise<void> {
        this.server.use(cors())
        this.server.use(express.json())
        this.server.set('trust proxy', 1)
        if (config.jsonFilter) {
            this.server.set('json replacer', config.jsonFilter)
        }
        return new Promise(resolve => {
            this.server.listen(config.port, () => {
                console.info('http server startup for', config.port)
                resolve()
            })
        })
    }

    setStatic(path: string, directory: string) {
        this.server.use(path, express.static(directory, { cacheControl: false }))
    }

    addRoutes(path: string, tasks: Class<HttpTask>[]) {
        const router = express.Router()
        for (const task of tasks) {
            let info = apis.get(task)
            if (info) {
                router[info.method](info.url, (req, res) => {
                    try {
                        let task = parse(req, info)
                        this.context.schedule(context => {
                            return this.executeTask(task, context, req, res)
                        })
                    } catch (e: any) {
                        if (e instanceof HttpError) {
                            res.send({ code: e.code, data: e.message })
                        } else {
                            res.send({ code: 500, data: e.message })
                        }
                        res.end()
                    }
                })
            }
        }
        this.server.use(path, router)
    }

    addUploadRoute(directory: string, path: string, task: Class<HttpTask>) {
        let info = apis.get(task)
        if (info) {
            const router = express.Router()
            const upload = multer({ dest: directory })
            router[info.method](info.url, upload.single('file'), (req, res) => {
                try {
                    let task = parse(req, info)
                    this.context.schedule(context => {
                        return this.executeTask(task, context, req, res)
                    })
                } catch (e: any) {
                    if (e instanceof HttpError) {
                        res.send({ code: e.code, data: e.message })
                    } else {
                        res.send({ code: 500, data: e.message })
                    }
                    res.end()
                }
            })
            this.server.use(path, router)
        }
    }

    private async executeTask(task: HttpTask, context: TaskContext, req: express.Request, res: express.Response) {
        try {
            let result = await task.execute(context, req, res)
            res.send({ code: 0, data: result })
        } catch (e: any) {
            console.error(e)
            if (e instanceof HttpError) {
                res.send({ code: e.code, data: e.message })
            } else {
                res.send({ code: 500, data: e.message })
            }
        } finally {
            res.end()
        }
    }
}

function parse(req: express.Request, info: ApiInfo<any>): HttpTask {
    let task = new info.clazz()
    for (let param of info.params) {
        task[param.alias] = fetchValue(req.params, param)
    }
    for (let query of info.querys) {
        task[query.alias] = fetchValue(req.query, query)
    }
    for (let header of info.headers) {
        task[header.alias] = fetchValue(req.headers, header)
    }
    if (info.body) {
        task[info.body.alias] = req.body
    }
    return task
}

function fetchValue(obj: any, options: ApiField) {
    let value = obj[options.name]
    if (options.type == 'number') {
        value = parseFloat(value)
    }
    if (options.required) {
        if (value == undefined || value == null || (options.type == 'number' && isNaN(value))) {
            throw new HttpError(400, `参数${options.name}为空`)
        }
    }
    return value
}



