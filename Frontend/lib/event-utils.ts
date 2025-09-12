// Event utility functions to prevent memory leaks
import { EventEmitter } from 'events';

// Increase default max listeners globally to prevent memory leak warnings
if (typeof process !== 'undefined' && process?.setMaxListeners) {
  process.setMaxListeners(20);
}

// Global EventEmitter instance with increased max listeners
export class SafeEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(15);
  }
}

// Utility to safely manage intervals
export class IntervalManager {
  private intervals: Set<NodeJS.Timeout> = new Set();

  createInterval(callback: () => void, ms: number): NodeJS.Timeout {
    const interval = setInterval(callback, ms);
    this.intervals.add(interval);
    return interval;
  }

  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  clearAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

// Hook to safely manage intervals in React components
export const createSafeInterval = () => {
  const manager = new IntervalManager();
  
  const cleanup = () => manager.clearAll();
  
  return {
    createInterval: (callback: () => void, ms: number) => 
      manager.createInterval(callback, ms),
    clearInterval: (interval: NodeJS.Timeout) => 
      manager.clearInterval(interval),
    cleanup
  };
};