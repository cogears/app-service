interface EventListener {
    (event: string, ...args: any[]): any
}

export default class EventDispatcher {
    private listeners: Record<string, EventListener[]> = {};

    dispatch(event: string, ...args: Array<any>) {
        if (this.listeners[event]) {
            let listeners = this.listeners[event].slice();
            for (let listener of listeners) {
                try {
                    listener(event, ...args);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    addEventListener(eventNames: string, listener: EventListener) {
        let events = eventNames.split(',').map(s => s.trim());
        for (let event of events) {
            if (this.listeners[event]) {
                if (this.listeners[event].indexOf(listener) == -1) {
                    this.listeners[event].push(listener);
                }
            } else {
                this.listeners[event] = [listener];
            }
        }
    }

    removeEventListener(eventNames: string, listener?: EventListener) {
        let events = eventNames.split(',').map(s => s.trim());
        for (let event of events) {
            if (listener) {
                if (this.listeners[event]) {
                    let i = this.listeners[event].indexOf(listener);
                    if (i >= 0) {
                        this.listeners[event].splice(i, 1);
                        if (this.listeners[event].length == 0) {
                            delete this.listeners[event];
                        }
                    }
                }
            } else {
                delete this.listeners[event];
            }
        }
    }

    removeAllEventListeners() {
        this.listeners = {};
    }
}