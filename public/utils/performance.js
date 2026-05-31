export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      renderTime: [],
      memory: [],
    };
    this.maxHistory = 100;
    this.observers = new Map();
  }

  recordFPS(fps) {
    this.metrics.fps.push({
      value: fps,
      timestamp: performance.now(),
    });
    this.trimHistory('fps');
    this.notifyObservers('fps', fps);
  }

  recordRenderTime(time) {
    this.metrics.renderTime.push({
      value: time,
      timestamp: performance.now(),
    });
    this.trimHistory('renderTime');
    this.notifyObservers('renderTime', time);
  }

  recordMemory() {
    if (performance.memory) {
      const memory = performance.memory.usedJSHeapSize / 1024 / 1024;
      this.metrics.memory.push({
        value: memory,
        timestamp: performance.now(),
      });
      this.trimHistory('memory');
      this.notifyObservers('memory', memory);
    }
  }

  trimHistory(metric) {
    if (this.metrics[metric].length > this.maxHistory) {
      this.metrics[metric] = this.metrics[metric].slice(-this.maxHistory);
    }
  }

  getAverage(metric) {
    const values = this.metrics[metric];
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v.value, 0);
    return sum / values.length;
  }

  getMin(metric) {
    const values = this.metrics[metric];
    if (values.length === 0) return 0;
    return Math.min(...values.map(v => v.value));
  }

  getMax(metric) {
    const values = this.metrics[metric];
    if (values.length === 0) return 0;
    return Math.max(...values.map(v => v.value));
  }

  on(metric, callback) {
    if (!this.observers.has(metric)) {
      this.observers.set(metric, []);
    }
    this.observers.get(metric).push(callback);
    return () => {
      const callbacks = this.observers.get(metric);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }

  notifyObservers(metric, value) {
    if (this.observers.has(metric)) {
      this.observers.get(metric).forEach(cb => cb(value));
    }
  }

  getReport() {
    return {
      fps: {
        avg: this.getAverage('fps'),
        min: this.getMin('fps'),
        max: this.getMax('fps'),
        samples: this.metrics.fps.length,
      },
      renderTime: {
        avg: this.getAverage('renderTime'),
        min: this.getMin('renderTime'),
        max: this.getMax('renderTime'),
        samples: this.metrics.renderTime.length,
      },
      memory: {
        avg: this.getAverage('memory'),
        min: this.getMin('memory'),
        max: this.getMax('memory'),
        samples: this.metrics.memory.length,
      },
    };
  }

  reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = [];
    });
  }
}

export function measureAsync(name, fn) {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name} (failed): ${duration.toFixed(2)}ms`);
      throw error;
    }
  };
}

export function measureSync(name, fn) {
  return (...args) => {
    const start = performance.now();
    try {
      const result = fn(...args);
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name} (failed): ${duration.toFixed(2)}ms`);
      throw error;
    }
  };
}
