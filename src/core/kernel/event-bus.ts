// ============================================
// EventBus — kernel pub/sub transport
// ============================================
// Extracted from Kernel so every manager shares one bus
// without importing the Kernel singleton (breaks the cycle).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventCallback = (...args: any[]) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();
  private onError: (event: string, err: unknown) => void;

  constructor(onError?: (event: string, err: unknown) => void) {
    this.onError = onError ?? (() => undefined);
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    return () => this.off(event, callback);
  }

  once(event: string, callback: EventCallback): () => void {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      callback(...(args as []));
    };
    return this.on(event, wrapper as EventCallback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...(args as []));
      } catch (e) {
        this.onError(event, e);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
