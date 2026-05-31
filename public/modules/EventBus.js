class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        this.onceListeners.get(event).push(callback);
        return () => this.off(event, callback, true);
    }

    off(event, callback, isOnce = false) {
        const map = isOnce ? this.onceListeners : this.listeners;
        if (map.has(event)) {
            const callbacks = map.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`EventBus error in ${event}:`, e);
                }
            });
        }

        if (this.onceListeners.has(event)) {
            const callbacks = [...this.onceListeners.get(event)];
            this.onceListeners.delete(event);
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`EventBus once error in ${event}:`, e);
                }
            });
        }
    }

    clear(event) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
        }
    }

    listenerCount(event) {
        let count = 0;
        if (this.listeners.has(event)) {
            count += this.listeners.get(event).length;
        }
        if (this.onceListeners.has(event)) {
            count += this.onceListeners.get(event).length;
        }
        return count;
    }
}

const eventBus = new EventBus();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}

export default EventBus;
export { EventBus };
