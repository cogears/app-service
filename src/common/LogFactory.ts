import * as fs from 'fs'
import * as path from 'path'

function n2(value: number) {
    return value < 10 ? '0' + value : value
}
function today() {
    let dt = new Date()
    return `${dt.getFullYear()}${n2(dt.getMonth() + 1)}${n2(dt.getDate())}`

}
function now() {
    let dt = new Date()
    return `${dt.getFullYear()}-${n2(dt.getMonth() + 1)}-${n2(dt.getDate())} ${n2(dt.getHours())}:${n2(dt.getMinutes())}:${n2(dt.getSeconds())}`
}

export default function (logPath: string = '') {
    if (!logPath) {
        logPath = path.join(__dirname, '..', 'logs')
    }
    fs.mkdirSync(logPath, { recursive: true })

    function log(level: string, ...args: any[]) {
        const logfile = path.join(logPath, today());
        let time = now()
        args = args.map(obj => typeof obj == 'object' ? JSON.stringify(obj) : obj)
        let text = `${time} ${level} - ` + args.join(' ') + '\n';
        fs.writeFile(logfile, text, { flag: 'a' }, function () { })
        return text;
    }

    const levels = ['info', 'warn', 'error', 'log']
    for (let key of levels) {
        // @ts-ignore
        let origin = console[key];
        // @ts-ignore
        console[key] = (...args) => {
            if (key == 'log') {
                return
            }
            let text = log(key, ...args);
            origin.apply(console, [text]);
        }
    }
}
