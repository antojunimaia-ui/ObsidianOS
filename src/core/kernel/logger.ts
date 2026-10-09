// ============================================
// Logger — kernel logging + boot log
// ============================================
// Owns the log ring and boot log. FATAL auto-escalates via
// the injected onFatal hook (wired by Kernel to FaultManager).

import type { KernelLogEntry, KernelLogLevel } from './types';
import type { EventBus } from './event-bus';

export class Logger {
  private logs: KernelLogEntry[] = [];
  private bootLog: string[] = [];
  private bus: EventBus;
  private onFatal: (entry: KernelLogEntry) => void;

  constructor(bus: EventBus, onFatal: (entry: KernelLogEntry) => void) {
    this.bus = bus;
    this.onFatal = onFatal;
  }

  log(level: KernelLogLevel, source: string, message: string, code?: string): void {
    const entry: KernelLogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message,
      code,
    };
    this.logs.push(entry);
    this.bus.emit('log', entry);

    // On FATAL, escalate (Kernel wires this to FaultManager.triggerBSOD)
    if (level === 'FATAL') {
      this.onFatal(entry);
    }
  }

  addBootLog(message: string): void {
    this.bootLog.push(message);
    this.bus.emit('bootLog', message);
  }

  getLogs(): KernelLogEntry[] {
    return [...this.logs];
  }

  getBootLog(): string[] {
    return [...this.bootLog];
  }

  reset(): void {
    this.logs = [];
    this.bootLog = [];
  }
}
