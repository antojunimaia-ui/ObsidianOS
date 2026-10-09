// ============================================
// Kernel Types — shared across kernel modules
// ============================================
// Pure types, zero runtime dependencies.

export type KernelLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'FATAL';

export interface KernelLogEntry {
  timestamp: number;
  level: KernelLogLevel;
  source: string;
  message: string;
  code?: string;
}

export interface DriverEntry {
  name: string;
  path: string;       // Path in virtual FS
  status: 'loaded' | 'failed' | 'not_found' | 'disabled';
  type: 'kernel' | 'filesystem' | 'network' | 'display' | 'input' | 'audio' | 'storage';
  loadOrder: number;
  dependencies: string[];
  errorMessage?: string;
}

export interface ServiceEntry {
  name: string;
  displayName: string;
  description: string;
  executablePath: string;   // Must exist in FS
  registryPath: string;     // Registry key that defines this
  status: 'running' | 'stopped' | 'failed' | 'starting' | 'stopping';
  startType: 'auto' | 'manual' | 'disabled' | 'boot' | 'system';
  pid?: number;
  dependencies: string[];
  errorMessage?: string;
  restartCount: number;
}

export interface SystemResource {
  totalMemory: number;      // MB
  usedMemory: number;
  totalDisk: number;        // MB
  usedDisk: number;
  cpuCores: number;
  cpuUsage: number;         // 0-100
  uptime: number;           // seconds
  networkUp: boolean;
}

export interface KernelInterrupt {
  irq: number;
  handler: string;
  description: string;
}

export type BootPhase =
  | 'OFF'
  | 'BIOS_POST'         // Power-On Self Test
  | 'BIOS_HARDWARE'     // Hardware detection
  | 'BOOTLOADER'        // Loading bootloader from boot.ini
  | 'KERNEL_INIT'       // Loading ntoskrnl.exe
  | 'HAL_INIT'          // Hardware Abstraction Layer
  | 'DRIVER_LOAD'       // Loading drivers
  | 'REGISTRY_LOAD'     // Loading registry hives
  | 'SERVICE_INIT'      // Starting services
  | 'SUBSYSTEM_INIT'    // Win32 subsystem (csrss.exe)
  | 'SESSION_MANAGER'   // Session Manager (smss.exe)
  | 'WINLOGON'          // Login subsystem
  | 'SHELL_INIT'        // Loading explorer.exe (shell)
  | 'OOBE'              // Out-Of-Box Experience (Initial Setup)
  | 'DESKTOP_READY'     // Desktop environment ready
  | 'BOOT_FAILURE'      // Critical failure during boot
  | 'BSOD';             // Blue Screen of Death

export interface BSODInfo {
  stopCode: string;
  technicalInfo: string;
  failedComponent: string;
  bugCheckCode: string;
  parameters: string[];
}

// ── Cascade Failure System (Dynamic) ─────────────────────────────────────────

export interface CascadeStep {
  processName: string;
  pid: number;
  stopCode: string;
  technical: string;
  component: string;
  bugCheck: string;
  delay: number;
}

export interface CascadeState {
  active: boolean;
  rootCause: string;
  rootStopCode: string;
  steps: CascadeStep[];
  currentStep: number;
  failedProcesses: string[];
  totalSteps: number;
}
