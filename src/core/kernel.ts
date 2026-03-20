// ============================================
// ObsidianOS Kernel - The Heart of Everything
// ============================================
// Every single component in the OS depends on this.
// The kernel manages: processes, memory, drivers, services,
// system calls, event logging, and inter-process communication.

import { v4 as uuidv4 } from 'uuid';
import type { Process, WindowState, FileSystemNode, SystemTheme, UserProfile } from '../types';
import { defaultNodes, makeFile, makeDir } from './defaultFileSystem';
import { defaultRegistry, type RegistryEntry, type RegistryValue } from './defaultRegistry';

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

class Kernel {
  private static instance: Kernel;
  
  // State
  private _bootPhase: BootPhase = 'OFF';
  private _logs: KernelLogEntry[] = [];
  private _drivers: Map<string, DriverEntry> = new Map();
  private _services: Map<string, ServiceEntry> = new Map();
  private _resources: SystemResource;
  private _bsodInfo: BSODInfo | null = null;
  private _bootLog: string[] = [];
  private _listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private _uptimeInterval: ReturnType<typeof setInterval> | null = null;
  private _initTime: number = 0;
  private _isInitialized: boolean = false;
  private _isBooting: boolean = false;
  private _isBootFinished: boolean = false;

  // ── Process Table ──────────────────────────────────────────────────────────
  private _processes: Map<number, Process> = new Map();
  private _nextPid: number = 100;

  // ── Window Table ──────────────────────────────────────────────────────────
  private _windows: Map<string, WindowState> = new Map();
  private _topZIndex: number = 100;
  private _activeWindowId: string | null = null;

  // ── File System ────────────────────────────────────────────────────────────
  private _filesystem: Map<string, FileSystemNode> = new Map();

  // ── Registry ───────────────────────────────────────────────────────────────
  private _registry: Record<string, Record<string, RegistryEntry>> = {};

  // ── System State ───────────────────────────────────────────────────────────
  private _user: UserProfile = {
    username: 'user', displayName: 'User', avatar: '', password: '',
    isAdmin: true, lastLogin: Date.now(),
  };
  private _isLocked: boolean = false;
  private _theme: SystemTheme = {
    mode: 'dark', accentColor: '#6366f1', wallpaper: 'default',
    transparency: true, animationSpeed: 'normal', fontSize: 'medium',
  };
  private _hardware = {
    volume: 75, isMuted: false, brightness: 100,
    isWifiConnected: true, isBluetooth: false, batteryLevel: 85,
  };

  private constructor() {
    this._resources = {
      totalMemory: 8192,
      usedMemory: 0,
      totalDisk: 256000,
      usedDisk: 42000,
      cpuCores: navigator.hardwareConcurrency || 8,
      cpuUsage: 0,
      uptime: 0,
      networkUp: false,
    };
    this._initSystemState();
    this._initFileSystem();
    this._initRegistry();
    this._initSystemProcesses();
  }

  // ========== THE BIOS (NATIVE BOOT) ==========
  async powerOn() {
    if (this._isBooting) return;
    this._isBooting = true;
    try {
      this.reset();
      this.fsRepairSystemFiles(); // Ensure bootmgr.exe is up to date
      this._isBootFinished = false; // Fresh start
      this.bootPhase = 'BIOS_POST';
      this.addBootLog('ObsidianOS BIOS v2.4.0');
      this.addBootLog('Checking Hardware... OK');
      
      this.bootPhase = 'BIOS_HARDWARE';
      this.addBootLog('Scanning for drives... Done [C: FIXED]');
      
      let bootmgr = this.fsGetNode('C:\\ObsidianOS\\System32\\bootmgr.exe');
      if (!bootmgr) {
        this.addBootLog('BOOTMGR not found. Starting Auto-Repair...');
        this.fsDeepReformat();
        bootmgr = this.fsGetNode('C:\\ObsidianOS\\System32\\bootmgr.exe');
        if (!bootmgr) throw new Error('SYSTEM_REPAIR_FAILED');
        this.addBootLog('Auto-Repair Success. BOOTMGR Restored.');
      }

      this.addBootLog('Locating Bootloader... Found [C:\\ObsidianOS\\System32\\bootmgr.exe]');
      this.bootPhase = 'BOOTLOADER';
      this.addBootLog('Handing over control to Boot Manager...');
      
      const pid = this.createProcess('bootmgr.exe', 'Boot Manager', '⚙️');
      this.executeBinary(pid, 'C:\\ObsidianOS\\System32\\bootmgr.exe');
    } catch (e: any) {
      this.log('ERROR', 'BIOS', `Hardware Failure: ${e.message}`);
      this.addBootLog('!!! BIOS HARDWARE FAILURE !!!');
      this.addBootLog('Reason: ' + e.message);
      this.bootPhase = 'BOOT_FAILURE';
    }
  }

  finalizeBoot() {
    this.addBootLog('Native Boot Handoff... OK');
    this.log('INFO', 'Kernel', 'Boot Manager handoff successful.');
    
    // Give UI thread a moment before signals change
    setTimeout(() => {
      this._isBooting = false;
      this._isBootFinished = true;
      this._isInitialized = true;
      this.startUptimeCounter();
      this.emit('boot:finished');
    }, 150);
  }

  async loadShell(): Promise<boolean> {
    const explorer = this.fsGetNode('C:\\ObsidianOS\\System32\\explorer.exe');
    if (!explorer) {
      this.triggerBSOD({
        stopCode: 'SHELL_INITIALIZATION_FAILED',
        technicalInfo: 'explorer.exe not found. Cannot load desktop shell.',
        failedComponent: 'explorer.exe',
        bugCheckCode: '0x000000F4',
        parameters: ['explorer.exe', 'C:\\ObsidianOS\\System32'],
      });
      return false;
    }

    this.bootPhase = 'SHELL_INIT';
    this.addBootLog('Starting Desktop Shell...');

    // App Discovery — scan System32 for app manifests and register them
    const fsProxy = {
      getChildren: (path: string) => this.fsGetChildren(path),
    };
    const { useAppRegistry } = await import('./appRegistry');
    const registryProxy = useAppRegistry.getState();
    await this.scanSystemApps(fsProxy, registryProxy);
    
    // Create processes
    this.createProcess('explorer.exe', 'ObsidianOS Explorer', '📁');
    this._resources.usedMemory += 96;

    const dwm = this.fsGetNode('C:\\ObsidianOS\\System32\\dwm.exe');
    if (dwm) {
      this.createProcess('dwm.exe', 'Desktop Window Manager', '🖥️');
      this._resources.usedMemory += 72;
    }

    const searchHost = this.fsGetNode('C:\\ObsidianOS\\System32\\SearchHost.exe');
    if (searchHost) {
      this.createProcess('SearchHost.exe', 'Search Host', '🔍');
      this._resources.usedMemory += 48;
    }

    this.bootPhase = 'DESKTOP_READY';
    this.log('INFO', 'Kernel', 'Desktop environment ready');
    return true;
  }


  // ========== System Init ==========
  private _initSystemState() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('obsidianos-system-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this._user = { ...this._user, ...parsed.user };
        this._theme = { ...this._theme, ...parsed.theme };
        this._hardware = { ...this._hardware, ...parsed.hardware };
      } catch (e) {
        console.error('Failed to parse obsidianos-system-v2', e);
      }
    } else {
      const legacy = localStorage.getItem('webos-system-v2') || localStorage.getItem('webos-system');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          const state = parsed.state || parsed; // Handle different structures
          if (state) {
            this._user = { ...this._user, ...(state.user || state.currentUser) };
            this._theme = { ...this._theme, ...state.theme };
            this._hardware = {
              volume: state.volume ?? state.hardware?.volume ?? 75,
              isMuted: state.isMuted ?? state.hardware?.isMuted ?? false,
              brightness: state.brightness ?? state.hardware?.brightness ?? 100,
              isWifiConnected: state.isWifiConnected ?? state.hardware?.isWifiConnected ?? true,
              isBluetooth: state.isBluetooth ?? state.hardware?.isBluetooth ?? false,
              batteryLevel: state.batteryLevel ?? state.hardware?.batteryLevel ?? 85,
            };
          }
          this._persistSystemState();
        } catch (e) {
          console.error('Failed to parse legacy system state', e);
        }
      }
    }
  }

  // ========== File System Init ==========
  private _initFileSystem() {
    if (typeof window === 'undefined') {
      this._filesystem = new Map(Object.entries(defaultNodes));
      return;
    }
    
    // Migrate or load
    const savedFsV2 = localStorage.getItem('obsidianos-filesystem-v2');
    if (savedFsV2) {
      try {
        this._filesystem = new Map(Object.entries(JSON.parse(savedFsV2)));
        return;
      } catch (e) {
        console.error('Failed to parse obsidianos-filesystem-v2', e);
      }
    }
    
    const legacyFs = localStorage.getItem('webos-filesystem-v2') || localStorage.getItem('webos-filesystem');
    if (legacyFs) {
      try {
        const parsed = JSON.parse(legacyFs);
        const nodes = parsed?.state?.nodes || parsed;
        this._filesystem = new Map(Object.entries(nodes));
        this._persistFileSystem(); // Save as ObsidianOS V2
        return;
      } catch (e) {
        console.error('Failed to parse legacy filesystem', e);
      }
    }
    
    this._filesystem = new Map(Object.entries(defaultNodes));
    this._persistFileSystem();
  }

  // ========== Registry Init ==========
  private _initRegistry() {
    if (typeof window === 'undefined') {
      this._registry = JSON.parse(JSON.stringify(defaultRegistry));
      return;
    }

    let loaded = false;

    // Try to load ObsidianOS V2 registry first
    const savedRegV2 = localStorage.getItem('obsidianos-registry-v2');
    if (savedRegV2) {
      try {
        this._registry = JSON.parse(savedRegV2);
        loaded = true;
      } catch (e) {
        console.error('Failed to parse obsidianos-registry-v2, attempting legacy migration.', e);
        // Fall through to legacy if parsing fails
      }
    }

    // If not loaded from V2, try to migrate from legacy
    if (!loaded) {
      const legacyReg = localStorage.getItem('webos-registry-v2') || localStorage.getItem('webos-registry');
      if (legacyReg) {
        try {
          const parsed = JSON.parse(legacyReg);
          this._registry = parsed?.state?.hives || parsed;
          this._persistRegistry(); // Save as ObsidianOS V2 after migration
          loaded = true;
        } catch (e) {
          console.error('Failed to parse legacy registry, falling back to default.', e);
          // Fall through to default if parsing fails
        }
      }
    }

    // If still not loaded, use default registry
    if (!loaded) {
      this._registry = JSON.parse(JSON.stringify(defaultRegistry));
      this._persistRegistry();
    }
  }

  // ========== System Process Init ==========
  // Popula a tabela de processos com os processos base do SO.
  // NÃO emite eventos — a inicialização é silenciosa.
  private _initSystemProcesses() {
    type InitProc = Omit<Process, 'startTime'>;
    const INITIAL: InitProc[] = [
      { pid: 0, name: 'System',         title: 'System Process',                    icon: '⚙️', status: 'running', memoryUsage: 350.2, cpuUsage: 0.1 },
      { pid: 1, name: 'smss.exe',       title: 'Session Manager Subsystem',         icon: '⚙️', status: 'running', memoryUsage: 12.1,  cpuUsage: 0 },
      { pid: 2, name: 'csrss.exe',      title: 'Client Server Runtime Process',     icon: '⚙️', status: 'running', memoryUsage: 45.8,  cpuUsage: 0.2 },
      { pid: 3, name: 'wininit.exe',    title: 'ObsidianOS Start-Up Application',   icon: '⚙️', status: 'running', memoryUsage: 18.5,  cpuUsage: 0 },
      { pid: 4, name: 'services.exe',   title: 'Services and Controller App',       icon: '⚙️', status: 'running', memoryUsage: 82.2,  cpuUsage: 0.3 },
      { pid: 5, name: 'lsass.exe',      title: 'Local Security Authority Process',  icon: '🔒', status: 'running', memoryUsage: 124.4, cpuUsage: 0.1 },
      { pid: 6, name: 'svchost.exe',    title: 'Service Host: Local System',        icon: '⚙️', status: 'running', memoryUsage: 428.6, cpuUsage: 0.5 },
      { pid: 7, name: 'dwm.exe',        title: 'Desktop Window Manager',            icon: '🖥️', status: 'running', memoryUsage: 162.3, cpuUsage: 1.2 },
      { pid: 8, name: 'explorer.exe',   title: 'ObsidianOS Explorer',               icon: '📁', status: 'running', memoryUsage: 285.7, cpuUsage: 0.8 },
      { pid: 9, name: 'SearchHost.exe', title: 'Search Host',                       icon: '🔍', status: 'running', memoryUsage: 145.2, cpuUsage: 0.3 },
    ];
    const startTime = Date.now();
    let totalRam = 0;
    INITIAL.forEach(p => {
      this._processes.set(p.pid, { ...p, startTime });
      totalRam += p.memoryUsage;
    });
    this._resources.usedMemory = totalRam;
  }

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  // ========== Event System ==========
  on(event: string, callback: (...args: any[]) => void) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)?.add(callback);
    return () => this.off(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void) {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this._listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach(cb => {
      try { cb(...args); } catch (e) { 
        this.log('ERROR', 'Kernel', `Event handler error: ${event}: ${e}`);
      }
    });
  }

  // ========== Logging ==========
  log(level: KernelLogLevel, source: string, message: string, code?: string) {
    const entry: KernelLogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message,
      code,
    };
    this._logs.push(entry);
    this.emit('log', entry);

    // On FATAL, trigger BSOD
    if (level === 'FATAL') {
      this.triggerBSOD({
        stopCode: code || 'CRITICAL_PROCESS_DIED',
        technicalInfo: message,
        failedComponent: source,
        bugCheckCode: '0x000000EF',
        parameters: [source, message],
      });
    }
  }

  addBootLog(message: string) {
    this._bootLog.push(message);
    this.emit('bootLog', message);
  }

  // ========== Boot Phase ==========
  get isBooting() { return this._isBooting; }
  get isBootFinished() { return this._isBootFinished; }
  get bootPhase() { return this._bootPhase; }
  set bootPhase(phase: BootPhase) {
    const prevPhase = this._bootPhase;
    this._bootPhase = phase;
    this.log('INFO', 'Kernel', `Boot phase: ${prevPhase} -> ${phase}`);
    this.emit('bootPhaseChange', phase, prevPhase);
    
    // Sync with React Store
    const storePhaseMap: Record<string, any> = {
      'OFF': 'off',
      'BIOS_POST': 'bios',
      'BIOS_HARDWARE': 'bios',
      'BOOTLOADER': 'bios',
      'KERNEL_INIT': 'loading',
      'HAL_INIT': 'loading',
      'DRIVER_LOAD': 'loading',
      'SERVICE_INIT': 'loading',
      'SHELL_INIT': 'loading',
      'WINLOGON': 'login',
      'BOOT_FAILURE': 'bios'
      // NOTE: DESKTOP_READY is intentionally omitted — the transition to 'desktop'
      // is handled by LockScreen after the user logs in via kernel.sysLogin()
    };
    try {
      this.emit('system:bootPhase', storePhaseMap[phase] || 'loading');
    } catch(e) {
      console.error("Kernel Store Sync Failed", e);
    }
  }
  
  // ========== System State Management ==========
  private _emitSystemSnapshot() {
    this.emit('system:snapshot', {
      user: this._user,
      isLocked: this._isLocked,
      theme: this._theme,
      hardware: this._hardware,
    });
  }

  private _persistSystemState() {
    if (typeof window === 'undefined') return;
    const state = { user: this._user, theme: this._theme, hardware: this._hardware };
    localStorage.setItem('obsidianos-system-v2', JSON.stringify(state));
    this._emitSystemSnapshot();
  }

  sysGetSnapshot() {
    return {
      user: this._user,
      isLocked: this._isLocked,
      theme: this._theme,
      hardware: this._hardware,
    };
  }

  sysLogin(password: string): boolean {
    if (this._user.password === '' || password === this._user.password) {
      this._isLocked = false;
      this._user.lastLogin = Date.now();
      this._persistSystemState();
      this.emit('system:bootPhase', 'desktop');
      return true;
    }
    return false;
  }

  sysLock() {
    this._isLocked = true;
    this._persistSystemState();
    this.emit('system:bootPhase', 'login');
  }

  sysUnlock() {
    this._isLocked = false;
    this._persistSystemState();
    this.emit('system:bootPhase', 'desktop');
  }

  sysSetTheme(updates: Partial<SystemTheme>) {
    this._theme = { ...this._theme, ...updates };
    this._persistSystemState();
  }

  sysSetVolume(volume: number) {
    this._hardware.volume = Math.max(0, Math.min(100, volume));
    this._persistSystemState();
  }

  sysToggleMute() {
    this._hardware.isMuted = !this._hardware.isMuted;
    this._persistSystemState();
  }

  sysSetBrightness(brightness: number) {
    this._hardware.brightness = Math.max(0, Math.min(100, brightness));
    this._persistSystemState();
  }

  sysToggleWifi() {
    this._hardware.isWifiConnected = !this._hardware.isWifiConnected;
    this._persistSystemState();
  }

  sysToggleBluetooth() {
    this._hardware.isBluetooth = !this._hardware.isBluetooth;
    this._persistSystemState();
  }

  // ========== Resources ==========
  get resources() { return { ...this._resources }; }
  
  allocateMemory(amount: number, processName: string): boolean {
    if (this._resources.usedMemory + amount > this._resources.totalMemory) {
      this.log('ERROR', 'MemoryManager', 
        `Out of memory: ${processName} requested ${amount}MB, available: ${this._resources.totalMemory - this._resources.usedMemory}MB`,
        'OUT_OF_MEMORY');
      return false;
    }
    this._resources.usedMemory += amount;
    this.emit('memoryChange', this._resources);
    return true;
  }

  freeMemory(amount: number) {
    this._resources.usedMemory = Math.max(0, this._resources.usedMemory - amount);
    this.emit('memoryChange', this._resources);
  }

  updateCpuUsage(usage: number) {
    this._resources.cpuUsage = Math.min(100, Math.max(0, usage));
    this.emit('cpuChange', this._resources);
  }

  // ========== Drivers ==========
  registerDriver(driver: DriverEntry) {
    this._drivers.set(driver.name, driver);
    this.emit('driverChange', driver);
  }

  getDriver(name: string) { return this._drivers.get(name); }
  getAllDrivers() { return Array.from(this._drivers.values()); }

  // ========== Services ==========
  registerService(service: ServiceEntry) {
    this._services.set(service.name, service);
    this.emit('serviceChange', service);
  }

  getService(name: string) { return this._services.get(name); }
  getAllServices() { return Array.from(this._services.values()); }

  updateServiceStatus(name: string, status: ServiceEntry['status'], error?: string) {
    const service = this._services.get(name);
    if (service) {
      service.status = status;
      if (error) service.errorMessage = error;
      if (status === 'failed') service.restartCount++;
      this.emit('serviceChange', service);
    }
  }

  // ========== BSOD ==========
  get bsodInfo() { return this._bsodInfo; }

  triggerBSOD(info: BSODInfo) {
    this._bsodInfo = {
      stopCode: info.stopCode || 'CRITICAL_PROCESS_DIED',
      technicalInfo: info.technicalInfo || 'No extra info',
      failedComponent: info.failedComponent || 'Unknown',
      bugCheckCode: info.bugCheckCode || '0x00000000',
      parameters: info.parameters || ['0x0', '0x0', '0x0', '0x0'],
    };
    this._bootPhase = 'BSOD';
    this.log('CRITICAL', 'Kernel', 
      `BSOD: ${info.stopCode} - ${info.technicalInfo}`);
    this.emit('bsod', info);
    this.emit('bootPhaseChange', 'BSOD', this._bootPhase);
    
    // Stop uptime counter
    if (this._uptimeInterval) {
      clearInterval(this._uptimeInterval);
    }
  }

  // ========== Uptime & Resource Loop ==========
  startUptimeCounter() {
    this._initTime = Date.now();
    this._uptimeInterval = setInterval(() => {
      this._resources.uptime = Math.floor((Date.now() - this._initTime) / 1000);
    }, 1000);
    this.startResourceLoop();
  }

  private _resourceInterval: ReturnType<typeof setInterval> | null = null;

  startResourceLoop() {
    if (this._resourceInterval) clearInterval(this._resourceInterval);
    
    this._resourceInterval = setInterval(() => {
      // In a real OS, the scheduler/kernel calculates this. 
      // We will pull from the processManager store directly to sync.
      // Note: We'll use a dynamic import or access the store via global if needed, 
      // but here we can just emit an event and let the stores respond or vice versa.
      // Better: The kernel is the source of truth, but since processManager 
      // is a store, we'll let it push updates or the kernel can pull if it has access.
      
      this.emit('resourceTick');
      
      // Check for Memory Overload
      if (this._resources.usedMemory > this._resources.totalMemory) {
         this.triggerBSOD({
            stopCode: 'MEMORY_MANAGEMENT',
            technicalInfo: `Physical memory exhausted. Used: ${this._resources.usedMemory}MB / Total: ${this._resources.totalMemory}MB`,
            failedComponent: 'ntoskrnl.exe',
            bugCheckCode: '0x0000001A',
            parameters: ['0x00000417', '0x00000000', '0x00000000', '0x00000000']
         });
      }
    }, 2000);
  }

  // ========== App Discovery ==========
  // Scans designated directories for .exe files and registers them as apps
  async scanSystemApps(fs: any, registry: any) {
    this.log('INFO', 'Discovery', 'Scanning system directories for executables...');
    
    try {
      const system32 = fs.getChildren('C:\\ObsidianOS\\System32');
      const progFiles = fs.getChildren('C:\\Program Files\\ObsidianOS Apps');
      const executables = [...system32, ...progFiles].filter((node: any) => node.extension === 'exe');
      
      this.log('INFO', 'Discovery', `Found ${executables.length} potential executables.`);
      
      for (const node of executables) {
        try {
          // Some .exe are binary blobs (system files), others are JSON manifests (web shortcuts)
          const content = node.content;
          if (content && content.startsWith('{')) {
            const manifest = JSON.parse(content);
            if (manifest.type === 'executable' && manifest.appId) {
              this.log('DEBUG', 'Discovery', `Registering app: ${manifest.name} (${manifest.appId})`);
              
              registry.registerApp({
                id: manifest.appId,
                name: manifest.name,
                icon: manifest.icon,
                category: manifest.category || 'system',
                defaultWidth: manifest.width || 800,
                defaultHeight: manifest.height || 600,
                minWidth: manifest.minWidth || 300,
                minHeight: manifest.minHeight || 200,
                isResizable: manifest.isResizable !== false,
                isSingleInstance: manifest.isSingleInstance === true,
              });
            }
          }
        } catch (e) {
          this.log('WARN', 'Discovery', `Skipped ${node.name}: Not a valid manifest. (${e})`);
        }
      }
      
      registry.setReady(true);
      this.log('INFO', 'Discovery', 'App discovery complete.');
    } catch (e) {
      this.log('ERROR', 'Discovery', `Discovery failed: ${e}`);
    }
  }

  // ========== Process Management ==========
  createProcess(name: string, title: string, icon: string, windowId?: string, binaryPath?: string, args: string[] = []): number {
    const pid = this._nextPid++;
    const ram = Math.random() * 80 + 30;
    this.allocateMemory(ram, name);
    const process: Process = {
      pid, name, title, icon,
      status: 'running',
      memoryUsage: ram,
      cpuUsage: Math.random() * 5,
      startTime: Date.now(),
      windowId,
    };
    this._processes.set(pid, process);
    this.log('DEBUG', 'ProcessManager', `Created: ${name} [PID:${pid}]`);
    this.emit('process:created', process);

    // If it's a binary file, execute its content
    if (binaryPath) {
      this.executeBinary(pid, binaryPath, args);
    }

    return pid;
  }

  // ========== Binary Execution Engine ==========
  async executeBinary(pid: number, path: string, args: string[] = []) {
    const node = this.fsGetNode(path);
    if (!node || node.type !== 'file' || !node.content) {
      this.log('ERROR', 'ExecutionEngine', `Binary not found or corrupted: ${path}`);
      this.terminateProcess(pid);
      return;
    }

    const proc = this.getProcess(pid);
    if (!proc) return;

    this.log('INFO', 'ExecutionEngine', `Executing binary: ${path} [PID:${pid}] with args: ${args.join(' ')}`);

    // System Calls Definition (The official OS API for binaries)
    const OS = {
      pid,
      args,
      print: (msg: string) => {
        this.emit('process:stdout', { pid, message: msg });
        this.log('DEBUG', `Proc:${pid}`, msg);
      },
      error: (msg: string) => {
        this.emit('process:stderr', { pid, message: msg });
        this.log('ERROR', `Proc:${pid}`, msg);
      },
      readFile: (p: string) => this.fsGetNode(p)?.content,
      writeFile: (p: string, c: string) => this.fsUpdateFileContent(p, c),
      listFiles: (p: string) => this.fsGetChildren(p).map(n => n.name),
      getEnv: (k: string) => ({ OS: 'ObsidianOS_NT', USER: this._user.username }[k]),
      getTimestamp: () => Date.now(),
      getResources: () => ({ ...this._resources }),
      terminate: (exitCode: number = 0) => {
        this.log('INFO', 'ExecutionEngine', `Process ${pid} terminated with exit code ${exitCode}`);
        this.terminateProcess(pid);
      },
      wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      // Hardware calls
      ping: () => ({ status: 'online', latency: Math.floor(Math.random() * 5) + 1 }),
      
      // --- NATIVE BOOT CALLS ---
      addBootLog: (m: string) => this.addBootLog(m),
      setBootPhase: (p: any) => { this.bootPhase = p; },
      triggerBSOD: (i: any) => this.triggerBSOD(i),
      finalizeBoot: () => this.finalizeBoot(),
      
      // --- SYSTEM MGMT ---
      allocateMemory: (s: number, n: string) => this.allocateMemory(s, n),
      createProcess: (n: string, t: string, i: string) => this.createProcess(n, t, i),
      registerDriver: (e: any) => { this._drivers.set(e.name, e); this.emit('driver:loaded', e); },
      registerService: (e: any) => { this._services.set(e.name, e); this.emit('service:started', e); },
      getDriver: (n: string) => this._drivers.get(n),
      getService: (n: string) => this._services.get(n),
      getAllServices: () => Array.from(this._services.values()),
      scanSystemApps: (fs: any, reg: any) => this.scanSystemApps(fs, reg)
    };

    try {
      // Auto-Linker: Prepends the SDK library if it exists
      const sdkNode = this.fsGetNode('C:\\ObsidianOS\\SDK\\lib\\obsidian.js');
      const sdkCode = sdkNode?.content || '';

      // THE SANDBOX: Using Function constructor to create a scope
      let scriptBody = '"use strict";\n';
      scriptBody += sdkCode + ';\n';
      scriptBody += '// ------------------\n';
      scriptBody += 'return (async () => {\n';
      scriptBody += '  try {\n';
      scriptBody += (node.content || "") + '\n';
      scriptBody += '  } catch (e) {\n';
      scriptBody += '    OS.addBootLog("Runtime Error: " + e.message);\n';
      scriptBody += '    OS.error("Runtime Error: " + e.message);\n';
      scriptBody += '    OS.terminate(1);\n';
      scriptBody += '  }\n';
      scriptBody += '})();';

      let binaryScript;
      try {
        binaryScript = new Function('OS', 'kernel', scriptBody);
        binaryScript(OS, this);
      } catch (err: any) {
        this.log('ERROR', 'ExecutionEngine', `Execution Failed for ${path}: ${err.message}`);
        this.addBootLog(`ERROR: Binary Execution Fail: ${path}`);
        this.addBootLog(`Reason: ${err.message}`);
        this.terminateProcess(pid);
      }
    } catch (outerError: any) {
      this.terminateProcess(pid);
    }
  }

  terminateProcess(pid: number) {
    const proc = this._processes.get(pid);
    if (!proc) return;
    this.freeMemory(proc.memoryUsage);
    this._processes.delete(pid);
    
    // Close associated windows without creating an infinite loop
    let windowsRemoved = false;
    for (const win of Array.from(this._windows.values())) {
      if (win.processId === pid) {
        this._windows.delete(win.id);
        windowsRemoved = true;
      }
    }
    
    // Re-evaluate active window if we killed one
    if (windowsRemoved) {
      const remaining = Array.from(this._windows.values()).filter(w => !w.isMinimized);
      remaining.sort((a, b) => b.zIndex - a.zIndex);
      if (remaining.length > 0) {
        const top = remaining[0];
        top.isActive = true;
        this._activeWindowId = top.id;
      } else {
        this._activeWindowId = null;
      }
      this._emitWindowSnapshot();
    }

    this.log('DEBUG', 'ProcessManager', `Terminated: ${proc.name} [PID:${pid}]`);
    this.emit('process:terminated', pid);
  }

  suspendProcess(pid: number) {
    const proc = this._processes.get(pid);
    if (!proc) return;
    const updated: Process = { ...proc, status: 'suspended' };
    this._processes.set(pid, updated);
    this.emit('process:updated', updated);
  }

  resumeProcess(pid: number) {
    const proc = this._processes.get(pid);
    if (!proc) return;
    const updated: Process = { ...proc, status: 'running' };
    this._processes.set(pid, updated);
    this.emit('process:updated', updated);
  }

  updateProcessCpu(pid: number, cpu: number) {
    const proc = this._processes.get(pid);
    if (!proc) return;
    const updated: Process = { ...proc, cpuUsage: cpu };
    this._processes.set(pid, updated);
    this.emit('process:updated', updated);
  }

  updateProcessMemory(pid: number, memory: number) {
    const proc = this._processes.get(pid);
    if (!proc) return;
    const updated: Process = { ...proc, memoryUsage: memory };
    this._processes.set(pid, updated);
    this.emit('process:updated', updated);
  }

  getProcess(pid: number): Process | undefined {
    return this._processes.get(pid);
  }

  getProcessByWindowId(windowId: string): Process | undefined {
    return Array.from(this._processes.values()).find(p => p.windowId === windowId);
  }

  getProcesses(): Process[] {
    return Array.from(this._processes.values());
  }

  getRunningProcesses(): Process[] {
    return this.getProcesses().filter(p => p.status === 'running');
  }

  // ========== File System Management ==========

  private _persistFileSystem() {
    if (typeof window === 'undefined') return;
    const obj = Object.fromEntries(this._filesystem);
    localStorage.setItem('obsidianos-filesystem-v2', JSON.stringify(obj));
    this.emit('fs:snapshot', obj);
  }

  fsGetNode(path: string): FileSystemNode | undefined {
    return this._filesystem.get(path);
  }

  fsGetChildren(path: string): FileSystemNode[] {
    return Array.from(this._filesystem.values()).filter(n => n.parentPath === path);
  }

  fsCreateFile(parentPath: string, name: string, content: string = '', extension: string = 'txt') {
    const path = `${parentPath}\\${name}`;
    const node = makeFile(path, name, parentPath, extension, content);
    this._filesystem.set(path, node);
    this._persistFileSystem();
  }

  fsCreateDirectory(parentPath: string, name: string) {
    const path = `${parentPath}\\${name}`;
    const node = makeDir(path, name, parentPath);
    this._filesystem.set(path, node);
    this._persistFileSystem();
  }

  fsDeleteNode(path: string) {
    for (const key of Array.from(this._filesystem.keys())) {
      if (key === path || key.startsWith(path + '\\')) {
        this._filesystem.delete(key);
      }
    }
    this._persistFileSystem();
  }

  fsRenameNode(path: string, newName: string) {
    const node = this._filesystem.get(path);
    if (!node) return;
    
    const parentPath = node.parentPath;
    const newPath = `${parentPath}\\${newName}`;
    
    for (const [key, n] of Array.from(this._filesystem.entries())) {
      if (key === path) {
        n.id = newPath;
        n.name = newName;
        n.path = newPath;
        n.modifiedAt = Date.now();
        this._filesystem.set(newPath, n);
        this._filesystem.delete(path);
      } else if (key.startsWith(path + '\\')) {
        const suffix = key.substring(path.length);
        const updatedPath = newPath + suffix;
        n.id = updatedPath;
        n.path = updatedPath;
        n.parentPath = n.parentPath === path ? newPath : n.parentPath.replace(path, newPath);
        this._filesystem.set(updatedPath, n);
        this._filesystem.delete(key);
      }
    }
    this._persistFileSystem();
  }

  fsMoveNode(fromPath: string, toPath: string) {
    const node = this._filesystem.get(fromPath);
    if (!node) return;
    const newPath = `${toPath}\\${node.name}`;
    
    node.id = newPath;
    node.path = newPath;
    node.parentPath = toPath;
    node.modifiedAt = Date.now();
    
    this._filesystem.set(newPath, node);
    this._filesystem.delete(fromPath);
    this._persistFileSystem();
  }

  fsUpdateFileContent(path: string, content: string) {
    const node = this._filesystem.get(path);
    if (!node || node.type !== 'file') return;
    
    node.content = content;
    node.size = content.length;
    node.modifiedAt = Date.now();
    
    this._filesystem.set(path, node);
    this._persistFileSystem();
  }

  fsRepairSystemFiles() {
    let repaired = false;
    for (const [key, defaultNode] of Object.entries(defaultNodes)) {
      const currentNode = this._filesystem.get(key);
      if (!currentNode || (defaultNode.attributes.isSystem && defaultNode.content !== currentNode.content)) {
        this._filesystem.set(key, { ...defaultNode });
        repaired = true;
      }
    }
    if (repaired) this._persistFileSystem();
  }

  /**
   * fsDeepReformat - Total System Wipe & Rebrand
   * Used for major upgrades or fixing corrupted/old rebranding data.
   */
  fsDeepReformat() {
    this.log('WARN', 'FileSystem', 'CRITICAL: Initiating Deep Reformat. All files will be reset.');
    
    // Clear the current virtual disk
    this._filesystem.clear();
    
    // Populate with the perfect default nodes (ObsidianOS)
    for (const [key, defaultNode] of Object.entries(defaultNodes)) {
      this._filesystem.set(key, { ...defaultNode });
    }
    
    // Persist and signal update
    this._persistFileSystem();
    this.emit('filesystem:snapshot', this.fsGetSnapshot());
    this.log('INFO', 'FileSystem', 'Deep Reformat complete. Disk is now purely ObsidianOS.');
  }

  fsGetSnapshot(): Record<string, FileSystemNode> {
    return Object.fromEntries(this._filesystem);
  }

  fsExists(path: string): boolean {
    return this._filesystem.has(path);
  }

  // ========== Registry Management ==========

  private _persistRegistry() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('obsidianos-registry-v2', JSON.stringify(this._registry));
    this.emit('registry:snapshot', this._registry);
  }

  regGetValue(path: string): RegistryValue | undefined {
    const parts = path.split('\\');
    const valueName = parts.pop();
    if (!valueName) return undefined;
    const keyPath = parts.join('\\');
    return this._registry[keyPath]?.[valueName]?.value;
  }

  regSetValue(path: string, type: RegistryEntry['type'], value: RegistryValue) {
    const parts = path.split('\\');
    const valueName = parts.pop();
    if (!valueName) return;
    const keyPath = parts.join('\\');
    
    if (!this._registry[keyPath]) {
      this._registry[keyPath] = {};
    }
    
    this._registry[keyPath][valueName] = { type, value };
    this._persistRegistry();
  }

  regDeleteValue(path: string) {
    const parts = path.split('\\');
    const valueName = parts.pop();
    if (!valueName) return;
    const keyPath = parts.join('\\');
    
    if (this._registry[keyPath] && this._registry[keyPath][valueName]) {
      delete this._registry[keyPath][valueName];
      this._persistRegistry();
    }
  }

  regGetSubKeys(path: string): string[] {
    return Object.keys(this._registry).filter(k => k.startsWith(path + '\\') && k !== path);
  }

  regKeyExists(path: string): boolean {
    return path in this._registry;
  }

  regGetSnapshot(): Record<string, Record<string, RegistryEntry>> {
    return this._registry; // Pass by ref is fine for React read-only state here or clone
  }

  // ========== Window Management ==========

  private _emitWindowSnapshot() {
    this.emit('window:snapshot', {
      windows: this.getWindows(),
      activeWindowId: this._activeWindowId,
      topZIndex: this._topZIndex,
    });
  }

  openWindow(config: {
    title: string; icon: string; appId: string;
    width?: number; height?: number; minWidth?: number; minHeight?: number;
    isResizable?: boolean; processId: number;
    params?: any;
  }): string {
    const id = uuidv4();
    const sw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const sh = typeof window !== 'undefined' ? window.innerHeight - 48 : 1032;
    const w = config.width || 800;
    const h = config.height || 600;
    
    // Deactivate current active window
    for (const [wid, win] of this._windows.entries()) {
      if (win.isActive) this._windows.set(wid, { ...win, isActive: false });
    }

    const nw: WindowState = {
      id, title: config.title, icon: config.icon, appId: config.appId,
      x: Math.max(40, (sw - w) / 2 + Math.random() * 60 - 30),
      y: Math.max(20, (sh - h) / 2 + Math.random() * 60 - 30),
      width: w, height: h,
      minWidth: config.minWidth || 400, minHeight: config.minHeight || 300,
      isMinimized: false, isMaximized: false, isActive: true,
      zIndex: ++this._topZIndex, opacity: 1,
      isResizable: config.isResizable !== false, isDraggable: true,
      isClosable: true, isMinimizable: true, isMaximizable: true,
      processId: config.processId,
      params: config.params,
    };
    this._windows.set(id, nw);
    this._activeWindowId = id;
    this._emitWindowSnapshot();
    return id;
  }

  closeWindow(id: string) {
    const win = this._windows.get(id);
    if (!win) return;
    if (win.processId) {
      this.terminateProcess(win.processId);
    } else {
      this._windows.delete(id);
      const top = Array.from(this._windows.values())
        .filter(w => !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0];
      if (top) {
        this._windows.set(top.id, { ...top, isActive: true });
        this._activeWindowId = top.id;
      } else {
        this._activeWindowId = null;
      }
      this._emitWindowSnapshot();
    }
  }

  minimizeWindow(id: string) {
    const win = this._windows.get(id);
    if (!win) return;
    this._windows.set(id, { ...win, isMinimized: true, isActive: false });
    const top = Array.from(this._windows.values())
      .filter(w => !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0];
    if (top) {
      this._windows.set(top.id, { ...top, isActive: true });
      this._activeWindowId = top.id;
    } else {
      this._activeWindowId = null;
    }
    this._emitWindowSnapshot();
  }

  maximizeWindow(id: string) {
    const win = this._windows.get(id);
    if (!win) return;
    const sw = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const sh = typeof window !== 'undefined' ? window.innerHeight - 48 : 1032;
    const updated: WindowState = {
      ...win, isMaximized: true,
      prevBounds: { x: win.x, y: win.y, width: win.width, height: win.height },
      x: 0, y: 0, width: sw, height: sh,
    };
    this._windows.set(id, updated);
    this.emit('window:updated', updated);
  }

  restoreWindow(id: string) {
    const win = this._windows.get(id);
    if (!win) return;
    if (win.isMinimized) {
      this._windows.set(id, { ...win, isMinimized: false, isActive: true, zIndex: ++this._topZIndex });
      this._activeWindowId = id;
      this._emitWindowSnapshot();
    } else if (win.isMaximized && win.prevBounds) {
      const updated: WindowState = {
        ...win, isMaximized: false,
        x: win.prevBounds.x, y: win.prevBounds.y,
        width: win.prevBounds.width, height: win.prevBounds.height,
      };
      this._windows.set(id, updated);
      this._activeWindowId = id;
      this._emitWindowSnapshot();
    }
  }

  focusWindow(id: string) {
    const newZ = ++this._topZIndex;
    this._activeWindowId = id;
    for (const [wid, win] of this._windows.entries()) {
      const t = wid === id;
      this._windows.set(wid, { ...win, isActive: t, zIndex: t ? newZ : win.zIndex, isMinimized: t ? false : win.isMinimized });
    }
    this._emitWindowSnapshot();
  }

  moveWindow(id: string, x: number, y: number) {
    const win = this._windows.get(id);
    if (!win) return;
    const updated = { ...win, x, y, isMaximized: false };
    this._windows.set(id, updated);
    this.emit('window:updated', updated);
  }

  resizeWindow(id: string, width: number, height: number) {
    const win = this._windows.get(id);
    if (!win) return;
    const updated: WindowState = { ...win, width: Math.max(win.minWidth, width), height: Math.max(win.minHeight, height) };
    this._windows.set(id, updated);
    this.emit('window:updated', updated);
  }

  updateWindowTitle(id: string, title: string) {
    const win = this._windows.get(id);
    if (!win) return;
    const updated = { ...win, title };
    this._windows.set(id, updated);
    this.emit('window:updated', updated);
  }

  toggleMaximize(id: string) {
    const win = this._windows.get(id);
    if (!win) return;
    if (win.isMaximized) this.restoreWindow(id); else this.maximizeWindow(id);
  }

  getWindow(id: string): WindowState | undefined { return this._windows.get(id); }
  getWindows(): WindowState[] { return Array.from(this._windows.values()); }
  getActiveWindow(): WindowState | undefined { return this._activeWindowId ? this._windows.get(this._activeWindowId) : undefined; }
  getVisibleWindows(): WindowState[] { return this.getWindows().filter(w => !w.isMinimized); }

  // ========== Getters ==========
  get logs() { return [...this._logs]; }
  get bootLog() { return [...this._bootLog]; }
  get isInitialized() { return this._isInitialized; }
  set isInitialized(v: boolean) { this._isInitialized = v; }
  get topZIndex() { return this._topZIndex; }
  get activeWindowId() { return this._activeWindowId; }

  // ========== System Calls ==========
  syscall(call: string, ...args: any[]): any {
    this.log('DEBUG', 'Syscall', `${call}(${args.map(a => JSON.stringify(a)).join(', ')})`);
    this.emit('syscall', call, args);
    return null;
  }

  // ========== Reset ==========
  reset() {
    this._isBooting = false;
    this._isBootFinished = false;
    this._bootPhase = 'OFF';
    this._logs = [];
    this._drivers.clear();
    this._services.clear();
    this._bsodInfo = null;
    this._bootLog = [];
    this._resources.usedMemory = 0;
    this._resources.cpuUsage = 0;
    this._resources.uptime = 0;
    this._isInitialized = false;
    // Reset lists
    this._processes.clear();
    this._windows.clear();
    this._nextPid = 100;
    this._topZIndex = 100;
    this._activeWindowId = null;
    
    this._initFileSystem();
    this._initRegistry();
    this._initSystemProcesses();
    if (this._uptimeInterval) clearInterval(this._uptimeInterval);
    this.emit('reset'); // store mirrors ouvem e sincronizam
  }
}

// Export singleton
export const kernel = Kernel.getInstance();
export default kernel;
