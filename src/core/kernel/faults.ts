// ============================================
// FaultManager — BSOD + dynamic cascade failures
// ============================================
// Owns failure state (BSOD info, cascade progress, critical
// process registry, dependency graph). Process destruction is
// delegated to the host (Kernel) via CascadeHost so this module
// never imports process/window tables directly.
//
// Also fixes the bugCheck → bugCheckCode field mismatch that
// broke `tsc -b` in the old monolithic kernel.

import type { BSODInfo, CascadeState, CascadeStep } from './types';
import type { EventBus } from './event-bus';

export interface CriticalProcessInfo {
  stopCode: string;
  technical: string;
  component: string;
  bugCheck: string;
}

/** Host capabilities the cascade executor needs from Kernel. */
export interface CascadeHost {
  /** Look up the latest process with this name. */
  getProcessByName(name: string): { pid: number } | undefined;
  /**
   * Destroy a process by name for cascade purposes:
   * remove from run queues, kill worker, free memory,
   * close its windows. Returns the pid, or null if gone.
   */
  destroyProcessForCascade(name: string): number | null;
  isBootPhaseBSOD(): boolean;
}

export class FaultManager {
  private bsodInfo: BSODInfo | null = null;
  private cascadeState: CascadeState | null = null;
  private cascadeTimeouts: ReturnType<typeof setTimeout>[] = [];
  private criticalProcesses = new Map<string, CriticalProcessInfo>();
  /** Map<providerName, Set<dependentName>> */
  private processDependencies = new Map<string, Set<string>>();
  private bus: EventBus;
  private host: CascadeHost;
  private log: (level: 'INFO' | 'CRITICAL' | 'ERROR', source: string, message: string) => void;
  private onBSOD: (info: BSODInfo) => void;

  constructor(
    bus: EventBus,
    host: CascadeHost,
    hooks: {
      log: (level: 'INFO' | 'CRITICAL' | 'ERROR', source: string, message: string) => void;
      onBSOD: (info: BSODInfo) => void;
    },
  ) {
    this.bus = bus;
    this.host = host;
    this.log = hooks.log;
    this.onBSOD = hooks.onBSOD;
  }

  get currentBsod(): BSODInfo | null {
    return this.bsodInfo;
  }

  get cascade(): CascadeState | null {
    return this.cascadeState ? { ...this.cascadeState } : null;
  }

  get isCascadeActive(): boolean {
    return this.cascadeState?.active === true;
  }

  // ── Critical registry (populated by processes via syscall) ─────────

  registerCritical(procName: string, info: CriticalProcessInfo): void {
    this.criticalProcesses.set(procName, info);
    this.log('INFO', 'Kernel', `Process "${procName}" registered as critical [${info.stopCode}]`);
  }

  getCritical(procName: string): CriticalProcessInfo | undefined {
    return this.criticalProcesses.get(procName);
  }

  declareDependency(procName: string, providerName: string): void {
    if (!this.processDependencies.has(providerName)) {
      this.processDependencies.set(providerName, new Set());
    }
    this.processDependencies.get(providerName)?.add(procName);
    this.log('INFO', 'Kernel', `"${procName}" depends on "${providerName}"`);
  }

  getDependents(providerName: string): Set<string> | undefined {
    return this.processDependencies.get(providerName);
  }

  // ── BSOD ───────────────────────────────────────────────────────────

  triggerBSOD(info: BSODInfo): void {
    this.bsodInfo = {
      stopCode: info.stopCode || 'CRITICAL_PROCESS_DIED',
      technicalInfo: info.technicalInfo || 'No extra info',
      failedComponent: info.failedComponent || 'Unknown',
      bugCheckCode: info.bugCheckCode || '0x00000000',
      parameters: info.parameters || ['0x0', '0x0', '0x0', '0x0'],
    };
    this.log('CRITICAL', 'Kernel', `BSOD: ${info.stopCode} - ${info.technicalInfo}`);
    // Kernel stops loops, flips boot phase and emits (single place).
    this.onBSOD(this.bsodInfo);
  }

  // ── Dynamic cascade ────────────────────────────────────────────────

  triggerDynamicCascade(providerName: string, dependentNames: string[]): void {
    if (this.cascadeState?.active || this.host.isBootPhaseBSOD()) return;

    const criticalInfo = this.criticalProcesses.get(providerName);

    // Build step list — kill each dependent with progressive delays
    const steps: CascadeStep[] = [];
    const visited = new Set<string>();

    const collectDependents = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      const proc = this.host.getProcessByName(name);
      if (!proc) return;
      const depInfo = this.criticalProcesses.get(name);
      steps.push({
        processName: name,
        pid: proc.pid,
        stopCode: depInfo?.stopCode || 'CASCADE_DEPENDENCY_FAILED',
        technical: depInfo?.technical || `"${name}" failed because its provider "${providerName}" terminated.`,
        component: depInfo?.component || name,
        bugCheck: depInfo?.bugCheck || '0x000000EF',
        delay: 0,
      });
      // Recurse: if this dependent also has dependents, collect them too
      const deeper = this.processDependencies.get(name);
      if (deeper) {
        for (const deeperName of deeper) collectDependents(deeperName);
      }
    };

    for (const dep of dependentNames) collectDependents(dep);

    steps.forEach((step, i) => { step.delay = 200 + (i * 300); });

    if (steps.length === 0) return;

    this.cascadeState = {
      active: true,
      rootCause: providerName,
      rootStopCode: criticalInfo?.stopCode || 'CASCADE_FAILURE',
      steps,
      currentStep: 0,
      failedProcesses: [],
      totalSteps: steps.length,
    };

    this.bus.emit('cascade:start', {
      rootCause: providerName,
      totalSteps: steps.length,
      stopCode: criticalInfo?.stopCode || 'CASCADE_FAILURE',
    });

    this.log('CRITICAL', 'Kernel', `DYNAMIC CASCADE: "${providerName}" died → ${steps.length} dependents will fail`);

    for (const step of steps) {
      const timeout = setTimeout(() => {
        const cs = this.cascadeState;
        if (!cs?.active) return;
        const pid = this.host.destroyProcessForCascade(step.processName);
        if (pid === null) return;

        this.log('CRITICAL', 'Kernel', `CASCADE [${cs.currentStep + 1}/${cs.totalSteps}]: ${step.processName} (PID:${pid}) — ${step.stopCode}`);

        cs.failedProcesses.push(step.processName);
        cs.currentStep++;

        this.bus.emit('cascade:step', {
          processName: step.processName,
          pid,
          stopCode: step.stopCode,
          technical: step.technical,
          current: cs.currentStep,
          total: cs.totalSteps,
        });

        this.bus.emit('process:terminated', pid);

        if (cs.currentStep >= cs.totalSteps) {
          setTimeout(() => {
            const done = this.cascadeState;
            if (done?.active) {
              done.active = false;
              this.bus.emit('cascade:complete', { rootCause: done.rootCause, failedProcesses: [...done.failedProcesses] });
              this.log('CRITICAL', 'Kernel', `CASCADE COMPLETE: ${done.failedProcesses.join(' → ')}`);
              this.triggerBSOD({
                stopCode: done.rootStopCode,
                technicalInfo: `"${done.rootCause}" failed → cascade: ${done.failedProcesses.join(' → ')}`,
                failedComponent: done.rootCause,
                bugCheckCode: criticalInfo?.bugCheck || '0x000000EF',
                parameters: [done.rootCause, String(done.totalSteps), '0x00000000', '0x00000000'],
              });
            }
          }, 400);
        }
      }, step.delay);
      this.cascadeTimeouts.push(timeout);
    }
  }

  cancelCascade(): void {
    for (const t of this.cascadeTimeouts) clearTimeout(t);
    this.cascadeTimeouts = [];
    if (this.cascadeState) {
      this.cascadeState.active = false;
      this.cascadeState = null;
    }
  }

  reset(): void {
    this.cancelCascade();
    this.bsodInfo = null;
    this.criticalProcesses.clear();
    this.processDependencies.clear();
  }
}
