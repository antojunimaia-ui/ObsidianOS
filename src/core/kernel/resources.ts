// ============================================
// ResourceManager — RAM/CPU/disk, drivers, services
// ============================================
// Owns machine resources plus the driver/service registries.
// The memory-overload → BSOD escalation is injected as a
// callback so this module never imports the Kernel.

import type { DriverEntry, ServiceEntry, SystemResource } from './types';
import type { EventBus } from './event-bus';

export class ResourceManager {
  private resources: SystemResource;
  private drivers = new Map<string, DriverEntry>();
  private services = new Map<string, ServiceEntry>();
  /**
   * Orçamento sem lastro PM (imagens de kernel, drivers, reservas de
   * binários via OS.allocateMemory). Tudo com space soma do lado do
   * Kernel via recompute — aqui só vive o overhead avulso.
   */
  private adhocMB = 0;
  private uptimeInterval: ReturnType<typeof setInterval> | null = null;
  private resourceInterval: ReturnType<typeof setInterval> | null = null;
  private initTime = 0;
  private bus: EventBus;
  private onMemoryExhausted: (used: number, total: number) => void;
  private log: (level: 'INFO' | 'ERROR' | 'WARN', source: string, message: string, code?: string) => void;

  constructor(
    bus: EventBus,
    hooks: {
      onMemoryExhausted: (used: number, total: number) => void;
      log: (level: 'INFO' | 'ERROR' | 'WARN', source: string, message: string, code?: string) => void;
    },
  ) {
    this.bus = bus;
    this.onMemoryExhausted = hooks.onMemoryExhausted;
    this.log = hooks.log;
    this.resources = {
      totalMemory: 8192,
      usedMemory: 0,
      totalDisk: 256000,
      usedDisk: 42000,
      cpuCores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
      cpuUsage: 0,
      uptime: 0,
      networkUp: false,
    };
  }

  get snapshot(): SystemResource {
    return { ...this.resources };
  }

  /** Public setter replacing the (kernel as any)._resources.totalMemory hack. */
  setTotalMemory(mb: number): void {
    this.resources.totalMemory = mb;
  }

  /** Silent write for the scheduler tick (it emits once per tick itself). */
  setCpuUsageRaw(usage: number): void {
    this.resources.cpuUsage = usage;
  }

  emitCpuChange(): void {
    this.bus.emit('cpuChange', { ...this.resources });
  }

  emitMemoryChange(): void {
    this.bus.emit('memoryChange', { ...this.resources });
  }

  allocateMemory(amount: number, processName: string): boolean {
    if (this.resources.usedMemory + amount > this.resources.totalMemory) {
      this.log('ERROR', 'MemoryManager',
        `Out of memory: ${processName} requested ${amount}MB, available: ${this.resources.totalMemory - this.resources.usedMemory}MB`,
        'OUT_OF_MEMORY');
      return false;
    }
    this.adhocMB += amount;
    this.resources.usedMemory += amount;
    this.emitMemoryChange();
    return true;
  }

  freeMemory(amount: number): void {
    this.adhocMB = Math.max(0, this.adhocMB - amount);
    this.resources.usedMemory = Math.max(0, this.resources.usedMemory - amount);
    this.emitMemoryChange();
  }

  /** Escrita autoritativa (o Kernel deriva o total e impõe aqui). */
  setUsedMemory(mb: number): void {
    this.resources.usedMemory = Math.max(0, mb);
    this.emitMemoryChange();
  }

  adhocOverheadMB(): number {
    return this.adhocMB;
  }

  updateCpuUsage(usage: number): void {
    this.resources.cpuUsage = Math.min(100, Math.max(0, usage));
    this.emitCpuChange();
  }

  // ── Drivers ────────────────────────────────────────────────────────

  registerDriver(driver: DriverEntry): void {
    this.drivers.set(driver.name, driver);
    this.bus.emit('driverChange', driver);
  }

  getDriver(name: string): DriverEntry | undefined {
    return this.drivers.get(name);
  }

  getAllDrivers(): DriverEntry[] {
    return Array.from(this.drivers.values());
  }

  // ── Services ───────────────────────────────────────────────────────

  registerService(service: ServiceEntry): void {
    this.services.set(service.name, service);
    this.bus.emit('serviceChange', service);
  }

  getService(name: string): ServiceEntry | undefined {
    return this.services.get(name);
  }

  getAllServices(): ServiceEntry[] {
    return Array.from(this.services.values());
  }

  updateServiceStatus(name: string, status: ServiceEntry['status'], error?: string): void {
    const service = this.services.get(name);
    if (service) {
      service.status = status;
      if (error) service.errorMessage = error;
      if (status === 'failed') service.restartCount++;
      this.bus.emit('serviceChange', service);
    }
  }

  // ── Uptime & resource loop ─────────────────────────────────────────

  startUptimeCounter(): void {
    this.initTime = Date.now();
    this.uptimeInterval = setInterval(() => {
      this.resources.uptime = Math.floor((Date.now() - this.initTime) / 1000);
    }, 1000);
    this.startResourceLoop();
  }

  startResourceLoop(): void {
    if (this.resourceInterval) clearInterval(this.resourceInterval);

    this.resourceInterval = setInterval(() => {
      this.bus.emit('resourceTick');

      // Check for Memory Overload
      if (this.resources.usedMemory > this.resources.totalMemory) {
        this.onMemoryExhausted(this.resources.usedMemory, this.resources.totalMemory);
      }
    }, 2000);
  }

  stopLoops(): void {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    this.uptimeInterval = null;
    if (this.resourceInterval) clearInterval(this.resourceInterval);
    this.resourceInterval = null;
  }

  reset(): void {
    this.stopLoops();
    this.drivers.clear();
    this.services.clear();
    this.adhocMB = 0;
    this.resources.usedMemory = 0;
    this.resources.cpuUsage = 0;
    this.resources.uptime = 0;
  }
}
