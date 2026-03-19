// ============================================
// Real Boot Sequence
// ============================================
// This boot process actually reads from the FileSystem and Registry.
// If critical files are missing, it WILL fail with a BSOD.
// Every step depends on the previous one.

import kernel from './kernel';
import type { DriverEntry, ServiceEntry } from './kernel';

// The file system and registry stores
import { useFileSystem } from '../stores/fileSystem';
import { useRegistry } from '../stores/registry';
import { useAppRegistry } from '../core/appRegistry';

// ========================================================
// Critical system files that MUST exist for boot to work
// (Documented here but checked iteratively in each phase)
// ========================================================
/*
const CRITICAL_BOOT_FILES = [
  { path: 'C:\\ObsidianOS\\System32\\ntoskrnl.exe', name: 'ObsidianOS Kernel', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\hal.dll', name: 'Hardware Abstraction Layer', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\boot.ini', name: 'Boot Configuration', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\win.ini', name: 'System Configuration', fatal: false },
  { path: 'C:\\ObsidianOS\\System32\\csrss.exe', name: 'Client/Server Runtime', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\smss.exe', name: 'Session Manager', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\winlogon.exe', name: 'Login Process', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\services.exe', name: 'Service Control Manager', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\lsass.exe', name: 'Local Security Authority', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\svchost.exe', name: 'Service Host', fatal: false },
  { path: 'C:\\ObsidianOS\\System32\\dwm.exe', name: 'Desktop Window Manager', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\explorer.exe', name: 'ObsidianOS Explorer Shell', fatal: true },
  { path: 'C:\\ObsidianOS\\System32\\conhost.exe', name: 'Console Host', fatal: false },
  { path: 'C:\\ObsidianOS\\System32\\taskmgr.exe', name: 'Task Manager', fatal: false },
];
*/

// Drivers that must be loaded from the filesystem
const SYSTEM_DRIVERS = [
  { name: 'ntfs.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\ntfs.sys', type: 'filesystem' as const, loadOrder: 1, dependencies: [], description: 'NTFS File System Driver' },
  { name: 'disk.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\disk.sys', type: 'storage' as const, loadOrder: 2, dependencies: [], description: 'Disk Driver' },
  { name: 'acpi.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\acpi.sys', type: 'kernel' as const, loadOrder: 3, dependencies: [], description: 'ACPI Driver' },
  { name: 'pci.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\pci.sys', type: 'kernel' as const, loadOrder: 4, dependencies: ['acpi.sys'], description: 'PCI Bus Driver' },
  { name: 'display.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\display.sys', type: 'display' as const, loadOrder: 5, dependencies: ['pci.sys'], description: 'Display Driver' },
  { name: 'hid.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\hid.sys', type: 'input' as const, loadOrder: 6, dependencies: [], description: 'Human Interface Device Driver' },
  { name: 'kbdclass.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\kbdclass.sys', type: 'input' as const, loadOrder: 7, dependencies: ['hid.sys'], description: 'Keyboard Driver' },
  { name: 'mouclass.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\mouclass.sys', type: 'input' as const, loadOrder: 8, dependencies: ['hid.sys'], description: 'Mouse Driver' },
  { name: 'netio.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\netio.sys', type: 'network' as const, loadOrder: 9, dependencies: [], description: 'Network I/O Driver' },
  { name: 'tcpip.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\tcpip.sys', type: 'network' as const, loadOrder: 10, dependencies: ['netio.sys'], description: 'TCP/IP Protocol Driver' },
  { name: 'ndis.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\ndis.sys', type: 'network' as const, loadOrder: 11, dependencies: ['tcpip.sys'], description: 'NDIS Interface Driver' },
  { name: 'hdaudio.sys', path: 'C:\\ObsidianOS\\System32\\drivers\\hdaudio.sys', type: 'audio' as const, loadOrder: 12, dependencies: ['pci.sys'], description: 'HD Audio Driver' },
];

// Services defined in registry - the boot reads these from HKLM\SYSTEM
const REGISTRY_SERVICES_PATH = 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services';

// Helper: wait with variable timing
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================
// THE REAL BOOT SEQUENCE
// ========================================================
export async function bootSequence(): Promise<boolean> {
  const fs = useFileSystem.getState();
  const registry = useRegistry.getState();
  const registryApp = useAppRegistry.getState();

  kernel.reset();
  kernel.log('INFO', 'BIOS', 'Power on. Initiating boot sequence...');

  try {
    // ===== PRE-BOOT: AUTOMATIC REPAIR & SYNC =====
    const explorer = fs.getNode('C:\\ObsidianOS\\System32\\explorer.exe');
    const isOldFormat = explorer && !explorer.content?.startsWith('{');
    
    if (localStorage.getItem('obsidianos_crashed') === '1' || !explorer || isOldFormat) {
      kernel.bootPhase = 'BIOS_POST';
      kernel.log('WARN', 'Recovery', 'Detectado alteração no sistema ou falha. Sincronizando arquivos...');
      kernel.addBootLog('Verifying system integrity and discovery files...');
      await wait(800);
      fs.repairSystemFiles();
      await wait(1500);
      localStorage.removeItem('obsidianos_crashed');
    }

    // ===== PHASE 1: BIOS POST =====
    kernel.bootPhase = 'BIOS_POST';
    kernel.addBootLog('BIOS POST... Checking memory...');
    await wait(400);
    
    const memoryOk = kernel.resources.totalMemory > 0;
    if (!memoryOk) {
      kernel.triggerBSOD({
        stopCode: 'MEMORY_MANAGEMENT',
        technicalInfo: 'No usable memory detected during POST',
        failedComponent: 'BIOS',
        bugCheckCode: '0x0000001A',
        parameters: ['0x00000000', '0x00000000'],
      });
      return false;
    }
    kernel.addBootLog(`Memory OK: ${kernel.resources.totalMemory} MB detected`);
    kernel.addBootLog(`CPU: ${kernel.resources.cpuCores} cores detected`);
    await wait(300);

    // ===== PHASE 2: HARDWARE DETECTION =====
    kernel.bootPhase = 'BIOS_HARDWARE';
    kernel.addBootLog('Detecting storage devices...');
    await wait(250);
    
    // Check if C: drive exists in filesystem
    const cDrive = fs.getNode('C:');
    if (!cDrive) {
      kernel.triggerBSOD({
        stopCode: 'INACCESSIBLE_BOOT_DEVICE',
        technicalInfo: 'Boot device C: not found. No bootable disk detected.',
        failedComponent: 'StorageManager',
        bugCheckCode: '0x0000007B',
        parameters: ['C:', 'DISK0'],
      });
      return false;
    }
    kernel.addBootLog(`Storage: Disk 0 (C:) - ${kernel.resources.totalDisk} MB - OK`);
    kernel.addBootLog('Detecting display adapter... OK');
    kernel.addBootLog('Detecting input devices... OK');
    kernel.addBootLog('Detecting network adapter... OK');
    await wait(300);

    // ===== PHASE 3: BOOTLOADER =====
    kernel.bootPhase = 'BOOTLOADER';
    kernel.addBootLog('Loading bootloader...');
    await wait(200);
    
    // Read boot.ini from filesystem - THIS IS REAL
    const bootIni = fs.getNode('C:\\ObsidianOS\\System32\\boot.ini');
    if (!bootIni) {
      kernel.triggerBSOD({
        stopCode: 'BOOTMGR_NOT_FOUND',
        technicalInfo: 'C:\\ObsidianOS\\System32\\boot.ini not found. Unable to load boot configuration.',
        failedComponent: 'BootManager',
        bugCheckCode: '0x000000E2',
        parameters: ['boot.ini', 'C:\\ObsidianOS\\System32'],
      });
      return false;
    }
    
    const bootConfig = bootIni.content || '';
    kernel.addBootLog(`Boot configuration loaded from ${bootIni.path}`);
    kernel.log('INFO', 'BootManager', `boot.ini content:\n${bootConfig}`);
    
    // Parse boot.ini for timeout and OS entry
    const timeoutMatch = bootConfig.match(/timeout=(\d+)/);
    const bootTimeout = timeoutMatch ? parseInt(timeoutMatch[1]) : 30;
    kernel.addBootLog(`Boot timeout: ${bootTimeout}s`);
    kernel.addBootLog('Selected: ObsidianOS Professional');
    await wait(300);

    // ===== PHASE 4: KERNEL INIT =====
    kernel.bootPhase = 'KERNEL_INIT';
    kernel.addBootLog('Loading ObsidianOS kernel (ntoskrnl.exe)...');
    await wait(200);
    
    const ntoskrnl = fs.getNode('C:\\ObsidianOS\\System32\\ntoskrnl.exe');
    if (!ntoskrnl) {
      kernel.triggerBSOD({
        stopCode: 'KERNEL_DATA_INPAGE_ERROR',
        technicalInfo: 'C:\\ObsidianOS\\System32\\ntoskrnl.exe not found. Kernel image is missing or corrupt.',
        failedComponent: 'ntoskrnl.exe',
        bugCheckCode: '0x0000007A',
        parameters: ['ntoskrnl.exe', 'C:\\ObsidianOS\\System32'],
      });
      return false;
    }
    kernel.addBootLog('Kernel loaded successfully');
    kernel.addBootLog(`Kernel version: ${ntoskrnl.metadata?.version || '10.0.26100'}`);
    kernel.allocateMemory(64, 'ntoskrnl.exe');
    
    // Create kernel process
    kernel.createProcess('System', 'System Process', '⚙️');
    await wait(200);

    // ===== PHASE 5: HAL INIT =====
    kernel.bootPhase = 'HAL_INIT';
    kernel.addBootLog('Initializing Hardware Abstraction Layer...');
    await wait(200);
    
    const halDll = fs.getNode('C:\\ObsidianOS\\System32\\hal.dll');
    if (!halDll) {
      kernel.triggerBSOD({
        stopCode: 'HAL_INITIALIZATION_FAILED',
        technicalInfo: 'C:\\ObsidianOS\\System32\\hal.dll missing. HAL failed to initialize.',
        failedComponent: 'hal.dll',
        bugCheckCode: '0x0000005C',
        parameters: ['hal.dll'],
      });
      return false;
    }
    kernel.addBootLog('HAL initialized successfully');
    kernel.allocateMemory(8, 'hal.dll');
    await wait(150);

    // ===== PHASE 6: DRIVER LOADING =====
    kernel.bootPhase = 'DRIVER_LOAD';
    kernel.addBootLog('Loading system drivers...');
    await wait(150);

    let driverErrors = 0;
    const criticalDriverTypes = ['filesystem', 'storage', 'kernel'];

    for (const driverDef of SYSTEM_DRIVERS) {
      await wait(80);
      
      // Check if driver file exists in filesystem
      const driverFile = fs.getNode(driverDef.path);
      const driverEntry: DriverEntry = {
        name: driverDef.name,
        path: driverDef.path,
        status: 'loaded',
        type: driverDef.type,
        loadOrder: driverDef.loadOrder,
        dependencies: driverDef.dependencies,
      };

      if (!driverFile) {
        driverEntry.status = 'not_found';
        driverEntry.errorMessage = `Driver file not found: ${driverDef.path}`;
        driverErrors++;
        kernel.log('WARN', 'DriverManager', `Driver ${driverDef.name} not found at ${driverDef.path}`);
        kernel.addBootLog(`  ⚠ ${driverDef.name} - NOT FOUND (${driverDef.path})`);

        // If it's a critical driver type, BSOD
        if (criticalDriverTypes.includes(driverDef.type)) {
          kernel.triggerBSOD({
            stopCode: 'DRIVER_IRQL_NOT_LESS_OR_EQUAL',
            technicalInfo: `Critical driver ${driverDef.name} not found at ${driverDef.path}`,
            failedComponent: driverDef.name,
            bugCheckCode: '0x000000D1',
            parameters: [driverDef.name, driverDef.path, driverDef.type],
          });
          return false;
        }
      } else {
        // Check dependencies
        let depsFailed = false;
        for (const dep of driverDef.dependencies) {
          const depDriver = kernel.getDriver(dep);
          if (!depDriver || depDriver.status !== 'loaded') {
            driverEntry.status = 'failed';
            driverEntry.errorMessage = `Dependency not met: ${dep}`;
            depsFailed = true;
            kernel.log('WARN', 'DriverManager', `${driverDef.name}: dependency ${dep} not available`);
            kernel.addBootLog(`  ⚠ ${driverDef.name} - DEPENDENCY FAILED (needs ${dep})`);
            break;
          }
        }

        if (!depsFailed) {
          kernel.addBootLog(`  ✓ ${driverDef.name} loaded (${driverDef.description})`);
          kernel.allocateMemory(Math.random() * 3 + 1, driverDef.name);
        }
      }

      kernel.registerDriver(driverEntry);
    }

    if (driverErrors > 0) {
      kernel.log('WARN', 'DriverManager', `${driverErrors} driver(s) had issues during load`);
    }
    kernel.addBootLog(`Drivers loaded: ${SYSTEM_DRIVERS.length - driverErrors}/${SYSTEM_DRIVERS.length}`);
    await wait(200);

    // ===== PHASE 7: REGISTRY LOAD =====
    kernel.bootPhase = 'REGISTRY_LOAD';
    kernel.addBootLog('Loading registry hives...');
    await wait(200);

    // Verify registry has required keys
    const requiredRegistryKeys = [
      'HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion',
      'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment',
      'HKEY_CURRENT_USER\\Software\\ObsidianOS\\Themes',
      'HKEY_CURRENT_USER\\Software\\ObsidianOS\\Desktop',
      'HKEY_CURRENT_USER\\Software\\ObsidianOS\\Taskbar',
    ];

    for (const keyPath of requiredRegistryKeys) {
      const exists = registry.keyExists(keyPath);
      if (!exists) {
        kernel.log('WARN', 'RegistryManager', `Registry key missing: ${keyPath}`);
        kernel.addBootLog(`  ⚠ Registry key missing: ${keyPath}`);
      } else {
        kernel.addBootLog(`  ✓ ${keyPath.split('\\').pop()}`);
      }
    }

    // Read OS version from registry
    const osVersion = registry.getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\DisplayVersion');
    const osBuild = registry.getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\CurrentBuild');
    kernel.addBootLog(`Registry loaded. OS Version: ${osVersion} Build ${osBuild}`);
    await wait(200);

    // ===== DISCOVERY PHASE: SCAN APPS FROM DISK =====
    await kernel.scanSystemApps(fs, registryApp);
    await wait(300);

    // ===== PHASE 8: SERVICE INITIALIZATION =====
    kernel.bootPhase = 'SERVICE_INIT';
    kernel.addBootLog('Starting services...');
    await wait(150);

    // Read services from registry
    const serviceDefinitions = getServicesFromRegistry();
    
    for (const svcDef of serviceDefinitions) {
      await wait(60);
      
      const service: ServiceEntry = {
        ...svcDef,
        status: 'starting',
        restartCount: 0,
      };

      // Skip disabled services
      if (service.startType === 'disabled') {
        service.status = 'stopped';
        kernel.addBootLog(`  ○ ${service.displayName} - DISABLED`);
        kernel.registerService(service);
        continue;
      }

      // Check if service executable exists in filesystem
      const svcExe = fs.getNode(service.executablePath);
      if (!svcExe) {
        service.status = 'failed';
        service.errorMessage = `Executable not found: ${service.executablePath}`;
        kernel.log('ERROR', 'ServiceManager', `Service ${service.name} failed: ${service.executablePath} not found`);
        kernel.addBootLog(`  ✗ ${service.displayName} - FAILED (${service.executablePath} not found)`);
        kernel.registerService(service);
        continue;
      }

      // Check dependencies
      let depOk = true;
      for (const dep of service.dependencies) {
        const depSvc = kernel.getService(dep);
        if (!depSvc || depSvc.status !== 'running') {
          service.status = 'failed';
          service.errorMessage = `Dependency service not running: ${dep}`;
          depOk = false;
          kernel.addBootLog(`  ✗ ${service.displayName} - DEPENDENCY FAILED (needs ${dep})`);
          break;
        }
      }

      if (depOk) {
        service.status = 'running';
        const pid = kernel.createProcess(service.name, service.displayName, '⚙️');
        service.pid = pid;
        kernel.allocateMemory(Math.random() * 20 + 5, service.name);
        kernel.addBootLog(`  ✓ ${service.displayName} [PID: ${pid}]`);
      }

      kernel.registerService(service);
    }

    const runningServices = kernel.getAllServices().filter(s => s.status === 'running');
    const failedServices = kernel.getAllServices().filter(s => s.status === 'failed');
    kernel.addBootLog(`Services: ${runningServices.length} running, ${failedServices.length} failed`);
    await wait(200);

    // ===== PHASE 9: SUBSYSTEM INIT =====
    kernel.bootPhase = 'SUBSYSTEM_INIT';
    kernel.addBootLog('Initializing Win32 subsystem...');
    await wait(150);

    // csrss.exe MUST exist
    const csrss = fs.getNode('C:\\ObsidianOS\\System32\\csrss.exe');
    if (!csrss) {
      kernel.triggerBSOD({
        stopCode: 'CRITICAL_PROCESS_DIED',
        technicalInfo: 'csrss.exe (Client/Server Runtime) not found. Win32 subsystem cannot initialize.',
        failedComponent: 'csrss.exe',
        bugCheckCode: '0x000000EF',
        parameters: ['csrss.exe'],
      });
      return false;
    }
    kernel.createProcess('csrss.exe', 'Client Server Runtime Process', '⚙️');
    kernel.allocateMemory(12, 'csrss.exe');
    kernel.addBootLog('Win32 subsystem initialized');
    await wait(100);

    // ===== PHASE 10: SESSION MANAGER =====
    kernel.bootPhase = 'SESSION_MANAGER';
    kernel.addBootLog('Starting Session Manager (smss.exe)...');
    await wait(150);

    const smss = fs.getNode('C:\\ObsidianOS\\System32\\smss.exe');
    if (!smss) {
      kernel.triggerBSOD({
        stopCode: 'SESSION_INITIALIZATION_FAILED',
        technicalInfo: 'smss.exe not found. Cannot create user session.',
        failedComponent: 'smss.exe',
        bugCheckCode: '0x0000006D',
        parameters: ['smss.exe'],
      });
      return false;
    }
    kernel.createProcess('smss.exe', 'Session Manager Subsystem', '⚙️');
    kernel.allocateMemory(4, 'smss.exe');
    kernel.addBootLog('Session Manager started');
    await wait(100);

    // ===== PHASE 11: WINLOGON =====
    kernel.bootPhase = 'WINLOGON';
    kernel.addBootLog('Starting login subsystem (winlogon.exe)...');
    await wait(150);

    const winlogon = fs.getNode('C:\\ObsidianOS\\System32\\winlogon.exe');
    if (!winlogon) {
      kernel.triggerBSOD({
        stopCode: 'LOGON_INITIALIZATION_FAILED',
        technicalInfo: 'winlogon.exe not found. Cannot display login screen.',
        failedComponent: 'winlogon.exe',
        bugCheckCode: '0x0000006F',
        parameters: ['winlogon.exe'],
      });
      return false;
    }
    kernel.createProcess('winlogon.exe', 'Windows Logon Application', '🔒');
    kernel.allocateMemory(8, 'winlogon.exe');

    // Also start lsass.exe (security)
    const lsass = fs.getNode('C:\\ObsidianOS\\System32\\lsass.exe');
    if (lsass) {
      kernel.createProcess('lsass.exe', 'Local Security Authority Process', '🔒');
      kernel.allocateMemory(16, 'lsass.exe');
      kernel.addBootLog('Local Security Authority started');
    } else {
      kernel.log('WARN', 'Security', 'lsass.exe not found - security features degraded');
      kernel.addBootLog('  ⚠ lsass.exe not found - security degraded');
    }

    kernel.addBootLog('Login subsystem ready');
    kernel.startUptimeCounter();
    kernel.resources.networkUp = true;
    await wait(100);

    // Boot is now complete enough for login
    // The shell (explorer.exe) will be loaded AFTER login
    kernel.log('INFO', 'Kernel', 'Boot sequence completed. Awaiting user login.');
    kernel.addBootLog('=== Boot sequence completed ===');
    kernel.addBootLog(`Total boot time: ~${Math.floor((Date.now() - kernel.logs[0].timestamp) / 100) / 10}s`);
    kernel.addBootLog(`Memory used: ${Math.floor(kernel.resources.usedMemory)} MB / ${kernel.resources.totalMemory} MB`);
    kernel.isInitialized = true;

    return true;
  } catch (error: any) {
    kernel.triggerBSOD({
      stopCode: 'UNEXPECTED_KERNEL_MODE_TRAP',
      technicalInfo: `Unhandled exception during boot: ${error.message || error}`,
      failedComponent: 'BootManager',
      bugCheckCode: '0x0000007F',
      parameters: [String(error)],
    });
    return false;
  }
}

// ========================================================
// Load shell AFTER login (explorer.exe)
// ========================================================
export async function loadShell(): Promise<boolean> {
  const fs = useFileSystem.getState();

  kernel.bootPhase = 'SHELL_INIT';
  kernel.addBootLog('Loading desktop shell (explorer.exe)...');
  await wait(200);

  const explorer = fs.getNode('C:\\ObsidianOS\\System32\\explorer.exe');
    if (!explorer) {
      kernel.triggerBSOD({
        stopCode: 'SHELL_INITIALIZATION_FAILED',
        technicalInfo: 'explorer.exe not found. Cannot load desktop shell.',
        failedComponent: 'explorer.exe',
        bugCheckCode: '0x000000F4',
        parameters: ['explorer.exe', 'C:\\ObsidianOS\\System32'],
      });
      return false;
    }
  
    // Check shell registry setting
    const registry = useRegistry.getState();
    const shellPath = registry.getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\Shell');
    kernel.log('INFO', 'ShellManager', `Shell configured as: ${shellPath || 'explorer.exe (default)'}`);
  
    kernel.createProcess('explorer.exe', 'ObsidianOS Explorer', '📁');
  kernel.allocateMemory(96, 'explorer.exe');

  // Start Desktop Window Manager
  const dwm = fs.getNode('C:\\ObsidianOS\\System32\\dwm.exe');
  if (dwm) {
    kernel.createProcess('dwm.exe', 'Desktop Window Manager', '🖥️');
    kernel.allocateMemory(72, 'dwm.exe');
    kernel.addBootLog('Desktop Window Manager started');
  } else {
    kernel.log('WARN', 'DWM', 'dwm.exe not found - desktop composition disabled');
    kernel.addBootLog('  ⚠ dwm.exe not found - no desktop composition');
  }

  // Start SearchHost
  const searchHost = fs.getNode('C:\\ObsidianOS\\System32\\SearchHost.exe');
  if (searchHost) {
    kernel.createProcess('SearchHost.exe', 'Search Host', '🔍');
    kernel.allocateMemory(48, 'SearchHost.exe');
  }

  kernel.bootPhase = 'DESKTOP_READY';
  kernel.addBootLog('Desktop shell loaded successfully');
  kernel.log('INFO', 'Kernel', 'Desktop environment ready');

  return true;
}

// ========================================================
// Read services from registry
// ========================================================
function getServicesFromRegistry(): Omit<ServiceEntry, 'status' | 'restartCount'>[] {
  // These services are defined in the registry under HKLM\SYSTEM\CurrentControlSet\Services
  const services: Omit<ServiceEntry, 'status' | 'restartCount'>[] = [
    {
      name: 'EventLog',
      displayName: 'Event Log Service',
      description: 'Manages system event logging',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\EventLog`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'PlugPlay',
      displayName: 'Plug and Play',
      description: 'Manages plug and play devices',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\PlugPlay`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'Power',
      displayName: 'Power Management',
      description: 'Manages power policy and notifications',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Power`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'RpcSs',
      displayName: 'Remote Procedure Call',
      description: 'RPC endpoint mapper and COM service',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\RpcSs`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'DcomLaunch',
      displayName: 'DCOM Server Process Launcher',
      description: 'Launches COM and DCOM servers',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\DcomLaunch`,
      startType: 'auto',
      dependencies: ['RpcSs'],
    },
    {
      name: 'Schedule',
      displayName: 'Task Scheduler',
      description: 'Enables scheduled tasks',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Schedule`,
      startType: 'auto',
      dependencies: ['RpcSs'],
    },
    {
      name: 'Themes',
      displayName: 'Themes Service',
      description: 'Manages visual themes and styles',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Themes`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'AudioSrv',
      displayName: 'ObsidianOS Audio Service',
      description: 'Manages audio devices and sessions',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\AudioSrv`,
      startType: 'auto',
      dependencies: ['PlugPlay'],
    },
    {
      name: 'Dhcp',
      displayName: 'DHCP Client',
      description: 'Registers and updates IP addresses',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Dhcp`,
      startType: 'auto',
      dependencies: [],
    },
    {
      name: 'Dnscache',
      displayName: 'DNS Client',
      description: 'Caches DNS name resolution',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Dnscache`,
      startType: 'auto',
      dependencies: ['Dhcp'],
    },
    {
      name: 'Spooler',
      displayName: 'Print Spooler',
      description: 'Manages print jobs',
      executablePath: 'C:\\ObsidianOS\\System32\\spoolsv.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\Spooler`,
      startType: 'auto',
      dependencies: ['RpcSs'],
    },
    {
      name: 'wuauserv',
      displayName: 'ObsidianOS Update',
      description: 'Manages system updates',
      executablePath: 'C:\\ObsidianOS\\System32\\svchost.exe',
      registryPath: `${REGISTRY_SERVICES_PATH}\\wuauserv`,
      startType: 'manual',
      dependencies: ['RpcSs'],
    },
  ];

  // Also read any custom services from registry
  // const registryServices = registry.getSubKeys(REGISTRY_SERVICES_PATH);
  // For now we use the hardcoded ones, but they could be added dynamically

  return services;
}
