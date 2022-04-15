import { EventDispatcher as IEventDispatcher, EventListener } from "types";

export default class EventDispatcher implements IEventDispatcher {
    private listeners: Record<string, EventListener[]> = {};
    private children: EventDispatcher[] = [];

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
        let children = this.children.slice();
        for (let child of children) {
            child.dispatch(event, ...args);
        }
    }

    addChild(child: EventDispatcher) {
        if (this.children.indexOf(child) == -1) {
            this.children.push(child);
        }
    }

    removeChild(child: EventDispatcher) {
        let i = this.children.indexOf(child);
        if (i >= 0) {
            this.children.splice(i, 1);
        }
    }

    removeAllChildren() {
        this.children = [];
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