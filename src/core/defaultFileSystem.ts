// ============================================
// Virtual File System Store
// ============================================
import type { FileSystemNode } from '../types';

const now = Date.now();

const defaultPermissions = { read: true, write: true, execute: false, hidden: false, system: false };
const defaultAttributes = { isReadOnly: false, isHidden: false, isSystem: false, isArchive: false };
const sysPermissions = { read: true, write: false, execute: true, hidden: false, system: true };
const sysAttributes = { isReadOnly: true, isHidden: false, isSystem: true, isArchive: false };

export function makeDir(path: string, name: string, parentPath: string, sys = false): FileSystemNode {
  return {
    id: path, name, type: 'directory', path, parentPath, size: 0,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sys ? sysPermissions : defaultPermissions,
    attributes: sys ? sysAttributes : defaultAttributes,
    children: [],
  };
}

export function makeFile(path: string, name: string, parentPath: string, ext: string, content = '', size = 0): FileSystemNode {
  return {
    id: path, name, type: 'file', path, parentPath, size: size || content.length,
    extension: ext, content,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: defaultPermissions, attributes: defaultAttributes,
  };
}

export function makeSysFile(path: string, name: string, parentPath: string, ext: string, content = ''): FileSystemNode {
  return {
    id: path, name, type: 'file', path, parentPath, size: content.length,
    extension: ext, content,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sysPermissions, attributes: sysAttributes,
  };
}

function makeSysExe(path: string, name: string, parentPath: string, description: string, version = '10.0.26100.1'): FileSystemNode {
  return {
    id: path, name, type: 'file', path, parentPath,
    size: Math.floor(Math.random() * 500000) + 50000,
    extension: name.split('.').pop() || 'exe',
    content: `[${name}]\nDescription=${description}\nVersion=${version}\nType=PE32+ executable\nSubsystem=Windows GUI\nCompany=Obsidian Corporation`,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sysPermissions, attributes: sysAttributes,
    metadata: { version, description, company: 'Obsidian Corporation' },
  };
}

function makeAppExe(path: string, name: string, parentPath: string, appId: string, icon: string, category: string, displayName: string): FileSystemNode {
  const manifest = JSON.stringify({
    appId,
    name: displayName,
    icon,
    category,
    type: 'executable',
    launchTarget: appId
  }, null, 2);

  return {
    id: path, name, type: 'file', path, parentPath,
    size: 1024 + Math.floor(Math.random() * 2000),
    extension: 'exe',
    content: manifest,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sysPermissions, attributes: sysAttributes,
    metadata: { appId, type: 'app_executable' },
  };
}

function makeBinaryExe(path: string, name: string, parentPath: string, code: string): FileSystemNode {
  return {
    id: path, name, type: 'file', path, parentPath,
    size: code.length,
    extension: 'exe',
    content: code,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sysPermissions, attributes: sysAttributes,
    metadata: { type: 'binary_executable' },
  };
}

// Build a realistic file system
export const defaultNodes: Record<string, FileSystemNode> = {};

// Root drives and directories
const dirs = [
  ['C:', 'C:', '', true],
  ['C:\\ObsidianOS', 'ObsidianOS', 'C:', true],
  ['C:\\ObsidianOS\\System32', 'System32', 'C:\\ObsidianOS', true],
  ['C:\\ObsidianOS\\System32\\drivers', 'drivers', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\System32\\config', 'config', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\System32\\wbem', 'wbem', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\System32\\WindowsPowerShell', 'WindowsPowerShell', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\System32\\en-US', 'en-US', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\System32\\pt-BR', 'pt-BR', 'C:\\ObsidianOS\\System32', true],
  ['C:\\ObsidianOS\\Fonts', 'Fonts', 'C:\\ObsidianOS', true],
  ['C:\\ObsidianOS\\Temp', 'Temp', 'C:\\ObsidianOS', false],
  ['C:\\ObsidianOS\\Logs', 'Logs', 'C:\\ObsidianOS', false],
  ['C:\\ObsidianOS\\INF', 'INF', 'C:\\ObsidianOS', true],
  ['C:\\ObsidianOS\\SysWOW64', 'SysWOW64', 'C:\\ObsidianOS', true],
  ['C:\\ObsidianOS\\SDK', 'SDK', 'C:\\ObsidianOS', true],
  ['C:\\ObsidianOS\\SDK\\lib', 'lib', 'C:\\ObsidianOS\\SDK', true],
  ['C:\\ObsidianOS\\SDK\\docs', 'docs', 'C:\\ObsidianOS\\SDK', true],
  ['C:\\ObsidianOS\\SDK\\examples', 'examples', 'C:\\ObsidianOS\\SDK', true],
  ['C:\\Program Files', 'Program Files', 'C:', true],
  ['C:\\Program Files\\ObsidianOS Apps', 'ObsidianOS Apps', 'C:\\Program Files', true],
  ['C:\\Program Files (x86)', 'Program Files (x86)', 'C:', true],
  ['C:\\Users', 'Users', 'C:', true],
  ['C:\\Users\\User', 'User', 'C:\\Users', false],
  ['C:\\Users\\User\\Desktop', 'Desktop', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\Documents', 'Documents', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\Downloads', 'Downloads', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\Pictures', 'Pictures', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\Music', 'Music', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\Videos', 'Videos', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\AppData', 'AppData', 'C:\\Users\\User', false],
  ['C:\\Users\\User\\AppData\\Local', 'Local', 'C:\\Users\\User\\AppData', false],
  ['C:\\Users\\User\\AppData\\Local\\Temp', 'Temp', 'C:\\Users\\User\\AppData\\Local', false],
  ['C:\\Users\\User\\AppData\\Roaming', 'Roaming', 'C:\\Users\\User\\AppData', false],
  ['C:\\Users\\Public', 'Public', 'C:\\Users', false],
  ['C:\\ProgramData', 'ProgramData', 'C:', false],
  ['C:\\Recovery', 'Recovery', 'C:', true],
  ['C:\\System Volume Information', 'System Volume Information', 'C:', true],
  ['C:\\System Volume Information\\VSS', 'VSS', 'C:\\System Volume Information', true],
] as const;

dirs.forEach(([path, name, parent, sys]) => {
  defaultNodes[path as string] = makeDir(path as string, name as string, parent as string, sys as boolean);
});

// =====================================================
// CRITICAL SYSTEM EXECUTABLES - boot depends on these!
// Deleting any of these will cause boot failure / BSOD
// =====================================================
const systemExes: [string, string, string, string][] = [
  // Kernel & core — hal.dll is a real JS module (see dllModules below)
  ['C:\\ObsidianOS\\System32\\ntoskrnl.exe', 'ntoskrnl.exe', 'C:\\ObsidianOS\\System32', 'ObsidianOS NT Kernel'],
  ['C:\\ObsidianOS\\System32\\csrss.exe', 'csrss.exe', 'C:\\ObsidianOS\\System32', 'Client/Server Runtime Subsystem'],
  ['C:\\ObsidianOS\\System32\\smss.exe', 'smss.exe', 'C:\\ObsidianOS\\System32', 'Session Manager Subsystem'],
  ['C:\\ObsidianOS\\System32\\winlogon.exe', 'winlogon.exe', 'C:\\ObsidianOS\\System32', 'Windows Logon Application'],
  ['C:\\ObsidianOS\\System32\\services.exe', 'services.exe', 'C:\\ObsidianOS\\System32', 'Services and Controller App'],
  ['C:\\ObsidianOS\\System32\\lsass.exe', 'lsass.exe', 'C:\\ObsidianOS\\System32', 'Local Security Authority Process'],
  ['C:\\ObsidianOS\\System32\\svchost.exe', 'svchost.exe', 'C:\\ObsidianOS\\System32', 'Host Process for Services'],
  ['C:\\ObsidianOS\\System32\\dwm.exe', 'dwm.exe', 'C:\\ObsidianOS\\System32', 'Desktop Window Manager'],
  ['C:\\ObsidianOS\\System32\\explorer.exe', 'explorer.exe', 'C:\\ObsidianOS\\System32', 'ObsidianOS Shell'],
  // Additional system executables
  ['C:\\ObsidianOS\\System32\\conhost.exe', 'conhost.exe', 'C:\\ObsidianOS\\System32', 'Console Window Host'],
  ['C:\\ObsidianOS\\System32\\SearchHost.exe', 'SearchHost.exe', 'C:\\ObsidianOS\\System32', 'Search Host Process'],
  ['C:\\ObsidianOS\\System32\\RuntimeBroker.exe', 'RuntimeBroker.exe', 'C:\\ObsidianOS\\System32', 'Runtime Broker'],
  ['C:\\ObsidianOS\\System32\\spoolsv.exe', 'spoolsv.exe', 'C:\\ObsidianOS\\System32', 'Print Spooler Service'],
  ['C:\\ObsidianOS\\System32\\wininit.exe', 'wininit.exe', 'C:\\ObsidianOS\\System32', 'ObsidianOS Start-Up Application'],
  ['C:\\ObsidianOS\\System32\\fontdrvhost.exe', 'fontdrvhost.exe', 'C:\\ObsidianOS\\System32', 'User-mode Font Driver Host'],
  ['C:\\ObsidianOS\\System32\\sihost.exe', 'sihost.exe', 'C:\\ObsidianOS\\System32', 'Shell Infrastructure Host'],
  ['C:\\ObsidianOS\\System32\\taskhostw.exe', 'taskhostw.exe', 'C:\\ObsidianOS\\System32', 'Task Host Window'],
  ['C:\\ObsidianOS\\System32\\ctfmon.exe', 'ctfmon.exe', 'C:\\ObsidianOS\\System32', 'CTF Loader'],
  // DLLs — hal.dll and kernel32.dll are real JS modules (see dllModules below)
  ['C:\\ObsidianOS\\System32\\user32.dll', 'user32.dll', 'C:\\ObsidianOS\\System32', 'Multi-User ObsidianOS USER API Client DLL'],
  ['C:\\ObsidianOS\\System32\\gdi32.dll', 'gdi32.dll', 'C:\\ObsidianOS\\System32', 'GDI Client DLL'],
  ['C:\\ObsidianOS\\System32\\ntdll.dll', 'ntdll.dll', 'C:\\ObsidianOS\\System32', 'NT Layer DLL'],
  ['C:\\ObsidianOS\\System32\\advapi32.dll', 'advapi32.dll', 'C:\\ObsidianOS\\System32', 'Advanced API DLL'],
  ['C:\\ObsidianOS\\System32\\shell32.dll', 'shell32.dll', 'C:\\ObsidianOS\\System32', 'ObsidianOS Shell Common DLL'],
  ['C:\\ObsidianOS\\System32\\ole32.dll', 'ole32.dll', 'C:\\ObsidianOS\\System32', 'OLE32 Component Object Model'],
  ['C:\\ObsidianOS\\System32\\msvcrt.dll', 'msvcrt.dll', 'C:\\ObsidianOS\\System32', 'C Runtime Library'],
  ['C:\\ObsidianOS\\System32\\combase.dll', 'combase.dll', 'C:\\ObsidianOS\\System32', 'COM Base Library'],
  ['C:\\ObsidianOS\\System32\\rpcrt4.dll', 'rpcrt4.dll', 'C:\\ObsidianOS\\System32', 'Remote Procedure Call Runtime'],
  ['C:\\ObsidianOS\\System32\\sechost.dll', 'sechost.dll', 'C:\\ObsidianOS\\System32', 'Security Host Library'],
  ['C:\\ObsidianOS\\System32\\bcryptprimitives.dll', 'bcryptprimitives.dll', 'C:\\ObsidianOS\\System32', 'Cryptographic Primitives Library'],
];

const binaryExes: [string, string, string, string][] = [
  [
    'C:\\ObsidianOS\\System32\\ping.exe', 
    'ping.exe', 
    'C:\\ObsidianOS\\System32', 
    `
      const target = OS.args[0] || '127.0.0.1';
      OS.print(\`Pinging \${target} with 32 bytes of data:\`);
      for(let i=0; i<4; i++) {
        await OS.wait(1000);
        const res = OS.ping();
        OS.print(\`Reply from \${target}: bytes=32 time=\${res.latency}ms TTL=128\`);
      }
      OS.terminate(0);
    `
  ],
  [
    'C:\\ObsidianOS\\System32\\ls.exe', 
    'ls.exe', 
    'C:\\ObsidianOS\\System32', 
    `
      const path = OS.args[0] || '.';
      const files = OS.listFiles(path);
      OS.print(\`Directory of \${path}:\`);
      files.forEach(f => OS.print(\`  \${f}\`));
      OS.terminate(0);
    `
  ],
  [
    'C:\\ObsidianOS\\System32\\sysinfo.exe', 
    'sysinfo.exe', 
    'C:\\ObsidianOS\\System32', 
    `
      const res = OS.getResources();
      OS.print("--- SYSTEM INFORMATION ---");
      OS.print(\`OS: \${OS.getEnv('OS')}\`);
      OS.print(\`Memory: \${Math.floor(res.usedMemory)} MB / \${res.totalMemory} MB\`);
      OS.print(\`Uptime: \${res.uptime} seconds\`);
      OS.print(\`CPU Cores: \${res.cpuCores}\`);
      OS.terminate(0);
    `
  ],
  [
    'C:\\ObsidianOS\\System32\\bootmgr.exe',
    'bootmgr.exe',
    'C:\\ObsidianOS\\System32',
    `
// ============================================
// OBSIDIAN OS NATIVE BOOT MANAGER (BOOTMGR)
// ============================================
OS.addBootLog('BootMgr: Initializing boot flow...');

// 1. Read boot.ini
OS.addBootLog('BootMgr: Reading boot.ini...');
const bootConfig = OS.readFile('C:\\\\ObsidianOS\\\\System32\\\\boot.ini');
if (!bootConfig) {
  OS.triggerBSOD({ stopCode: 'BOOT_LOADER_FAILURE', technicalInfo: 'boot.ini missing' });
  return;
}

// 2. Parse ARC path
const timeoutMatch = bootConfig.match(/timeout=(\\d+)/i);
const timeout = timeoutMatch ? parseInt(timeoutMatch[1], 10) : 3;
const defaultArcMatch = bootConfig.match(/default=(.*)/i);
const arcPath = defaultArcMatch ? defaultArcMatch[1].trim() : '';

OS.addBootLog('BootMgr: OS Target -> ' + arcPath);
if (!arcPath.includes('partition(1)')) {
  OS.triggerBSOD({ stopCode: 'INACCESSIBLE_BOOT_DEVICE', technicalInfo: 'Arc Path Partition Fail' });
  return;
}

// 3. Find System Folder
const sysRootMatch = arcPath.match(/partition[(]1[)]\\\\(.*)/i);
const sysRoot = (sysRootMatch && sysRootMatch[1]) ? sysRootMatch[1].trim() : 'ObsidianOS';
const files = OS.listFiles('C:');
const actualRoot = files.find(f => f.toLowerCase() === sysRoot.toLowerCase());
if (!actualRoot) {
  OS.triggerBSOD({ stopCode: 'BOOT_LOADER_FAILURE', technicalInfo: 'System folder not found: ' + sysRoot });
  return;
}
OS.addBootLog('BootMgr: System Root -> C:\\\\' + actualRoot + ' [OK]');

// 4. Load Kernel (ntoskrnl.exe)
OS.setBootPhase('KERNEL_INIT');
OS.addBootLog('BootMgr: Loading ntoskrnl.exe...');
const kernelCode = OS.readFile('C:\\\\' + actualRoot + '\\\\System32\\\\ntoskrnl.exe');
if (!kernelCode) { OS.triggerBSOD({ stopCode: 'KERNEL_DATA_INPAGE_ERROR', technicalInfo: 'ntoskrnl.exe missing' }); return; }
OS.allocateMemory(64, 'ntoskrnl.exe');
OS.createProcess('System', 'System Process', '⚙️');

// 5. Load kernel32.dll, gdi32.dll, user32.dll — Base API
OS.addBootLog('BootMgr: Loading kernel32.dll...');
const k32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\kernel32.dll');
if (!k32ok) { OS.triggerBSOD({ stopCode: 'KERNEL32_INIT_FAILED', technicalInfo: 'kernel32.dll failed to load', failedComponent: 'kernel32.dll', bugCheckCode: '0x0000007B', parameters: ['kernel32.dll'] }); return; }
OS.allocateMemory(12, 'kernel32.dll');
OS.addBootLog('  ✓ kernel32.dll');

OS.addBootLog('BootMgr: Loading gdi32.dll...');
const gdi32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\gdi32.dll');
if (!gdi32ok) { OS.triggerBSOD({ stopCode: 'GDI32_INIT_FAILED', technicalInfo: 'gdi32.dll failed to load', failedComponent: 'gdi32.dll', bugCheckCode: '0x0000007C', parameters: ['gdi32.dll'] }); return; }
OS.allocateMemory(8, 'gdi32.dll');
OS.addBootLog('  ✓ gdi32.dll');

OS.addBootLog('BootMgr: Loading user32.dll...');
const user32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\user32.dll');
if (!user32ok) { OS.triggerBSOD({ stopCode: 'USER32_INIT_FAILED', technicalInfo: 'user32.dll failed to load', failedComponent: 'user32.dll', bugCheckCode: '0x0000007D', parameters: ['user32.dll'] }); return; }
OS.allocateMemory(10, 'user32.dll');
OS.addBootLog('  ✓ user32.dll');

// 6. Load HAL
OS.setBootPhase('HAL_INIT');
OS.addBootLog('BootMgr: Loading hal.dll...');
const halOk = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\hal.dll');
if (!halOk) { OS.triggerBSOD({ stopCode: 'HAL_INITIALIZATION_FAILED', technicalInfo: 'hal.dll failed to initialize', failedComponent: 'hal.dll', bugCheckCode: '0x0000005C', parameters: ['hal.dll'] }); return; }
OS.allocateMemory(8, 'hal.dll');
OS.addBootLog('  ✓ hal.dll');

// 7. Load Drivers
OS.setBootPhase('DRIVER_LOAD');
OS.addBootLog('BootMgr: Loading drivers...');

// volmgr.sys — mounts the virtual disk (OPFS)
OS.addBootLog('  Loading volmgr.sys...');
const volmgrOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\volmgr.sys');
if (!volmgrOk) { OS.triggerBSOD({ stopCode: 'VOLMGR_FAILED', technicalInfo: 'Volume Manager failed to initialize. Disk cannot be mounted.', failedComponent: 'volmgr.sys', bugCheckCode: '0x0000006B', parameters: ['volmgr.sys'] }); return; }
OS.addBootLog('  ✓ volmgr.sys');

// ntfs.sys — registers the filesystem driver
OS.addBootLog('  Loading ntfs.sys...');
const ntfsOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\ntfs.sys');
if (!ntfsOk) { OS.triggerBSOD({ stopCode: 'NTFS_FILE_SYSTEM', technicalInfo: 'NTFS driver failed to initialize.', failedComponent: 'ntfs.sys', bugCheckCode: '0x00000024', parameters: ['ntfs.sys'] }); return; }
OS.addBootLog('  ✓ ntfs.sys');

// vss.sys — Volume Shadow Copy (non-critical, best-effort)
OS.addBootLog('  Loading vss.sys...');
const vssOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\vss.sys');
if (vssOk) { OS.addBootLog('  ✓ vss.sys'); } else { OS.addBootLog('  ! vss.sys failed (non-critical)'); }

// Remaining passive drivers
const passiveDrivers = ['disk.sys', 'display.sys', 'hid.sys', 'netio.sys'];
for (const d of passiveDrivers) {
  OS.registerDriver({ name: d, status: 'loaded', type: 'kernel' });
  OS.addBootLog('  ✓ ' + d);
}

// 8. Finalize
OS.setBootPhase('SERVICE_INIT');
OS.addBootLog('BootMgr: Enabling user session...');
OS.finalizeBoot();
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\drivers\\volmgr.sys',
    'volmgr.sys',
    'C:\\ObsidianOS\\System32\\drivers',
    `
// ============================================
// volmgr.sys — Volume Manager Driver
// Mounts the virtual disk using OPFS.
// Runs during DRIVER_LOAD phase.
// ============================================
OS.addBootLog('volmgr: Initializing Volume Manager...');

const available = await kernel.opfsDriver.isAvailable();
if (!available) {
  OS.error('volmgr: OPFS not available in this browser.');
  OS.terminate(1);
  return;
}

const diskExists = await kernel.opfsDriver.diskExists();

if (!diskExists) {
  OS.addBootLog('volmgr: No disk found. Formatting virtual disk...');
  const defaultNodes = await kernel.getDefaultNodes();
  await kernel.opfsDriver.formatDisk(defaultNodes);
  OS.addBootLog('volmgr: Format complete. Volume C: created.');
} else {
  OS.addBootLog('volmgr: Existing disk found. Mounting C:...');
}

OS.registerDriver({
  name: 'volmgr',
  path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\volmgr.sys',
  status: 'loaded',
  type: 'storage',
  loadOrder: 1,
  dependencies: [],
});

OS.addBootLog('volmgr: Volume C: mounted [OPFS]');
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\drivers\\ntfs.sys',
    'ntfs.sys',
    'C:\\ObsidianOS\\System32\\drivers',
    `
// ============================================
// ntfs.sys — NTFS Filesystem Driver
// Registers async I/O operations with the kernel.
// Cache was already hydrated by powerOn() if OPFS existed.
// On first boot, volmgr.sys formatted the disk — hydrate now.
// ============================================
OS.addBootLog('ntfs: Initializing NTFS driver...');

// Register the filesystem driver on the kernel
await kernel.registerFsDriver(kernel.opfsDriver);

// Only hydrate if not already done (first boot after format)
const alreadyHydrated = kernel.getFsNodeCount() > 0 && kernel.isDiskDriverActive();
if (!alreadyHydrated) {
  OS.addBootLog('ntfs: Hydrating filesystem cache...');
  const count = await kernel.hydrateFromDisk();
  OS.addBootLog('ntfs: Loaded ' + count + ' nodes into cache.');
} else {
  OS.addBootLog('ntfs: Cache already loaded (' + kernel.getFsNodeCount() + ' nodes).');
}

OS.registerDriver({
  name: 'ntfs',
  path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\ntfs.sys',
  status: 'loaded',
  type: 'filesystem',
  loadOrder: 2,
  dependencies: ['volmgr'],
});

OS.addBootLog('ntfs: NTFS driver ready.');
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\drivers\\vss.sys',
    'vss.sys',
    'C:\\ObsidianOS\\System32\\drivers',
    `
// ============================================
// vss.sys — Volume Shadow Copy Service Driver
// Creates a snapshot of all system files into
// C:\\System Volume Information\\VSS\\snapshot.json
// Used by fsStartupRepair to restore files from
// a real on-disk snapshot instead of hardcoded defaults.
// ============================================
OS.addBootLog('vss: Volume Shadow Copy Service starting...');

const SNAPSHOT_FILE = 'C:\\\\System Volume Information\\\\VSS\\\\snapshot.json';

// Snapshot all system files directly from the kernel filesystem map
const snapshot = {};
let count = 0;

// kernel._filesystem is a Map<path, FileSystemNode>
kernel._filesystem.forEach(function(node, path) {
  if (node.attributes && node.attributes.isSystem && node.type === 'file' && node.content) {
    snapshot[path] = node.content;
    count++;
  }
});

OS.writeFile(SNAPSHOT_FILE, JSON.stringify({ timestamp: Date.now(), files: snapshot }));
OS.addBootLog('vss: Snapshot created (' + count + ' system files)');

OS.registerDriver({
  name: 'vss',
  path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\vss.sys',
  status: 'loaded',
  type: 'storage',
  loadOrder: 3,
  dependencies: ['ntfs'],
});

OS.terminate(0);
    `.trim()
  ]
];

const sdkFiles: [string, string, string, string][] = [
  [
    'C:\\ObsidianOS\\SDK\\lib\\obsidian.js',
    'obsidian.js',
    'C:\\ObsidianOS\\SDK\\lib',
    `
// ObsidianOS Runtime Library (Standard SDK)
var StdIO = {
  print: (m) => OS.print(m),
  error: (m) => OS.error(m),
  clear: () => OS.print("\u001b[2J\u001b[H")
};
var FS = {
  read: (p) => OS.readFile(p),
  write: (p, c) => OS.writeFile(p, c),
  ls: (p) => OS.listFiles(p)
};
var Proc = {
  pid: OS.pid,
  args: OS.args,
  exit: (c) => OS.terminate(c),
  wait: (ms) => OS.wait(ms)
};
var Kernel = {
  uptime: () => OS.getResources().uptime,
  ping: () => OS.ping()
};
var print = StdIO.print;
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\SDK\\docs\\syscalls.txt',
    'syscalls.txt',
    'C:\\ObsidianOS\\SDK\\docs',
    `
--- OBSIDIAN OS SYSTEM CALL REFERENCE ---
Version: 2.0.0-GA
Loaded libraries: kernel32.dll, hal.dll

════════════════════════════════════════
 CORE OS API  (always available as OS.*)
════════════════════════════════════════
OS.print(msg)               stdout
OS.error(msg)               stderr
OS.readFile(path)           read file → string | undefined
OS.writeFile(path, content) write/create file
OS.listFiles(path)          list directory → string[]
OS.wait(ms)                 async sleep
OS.terminate(exitCode)      exit process
OS.getResources()           { totalMemory, usedMemory, cpuCores, cpuUsage, uptime, networkUp }
OS.getEnv(key)              OS | USER
OS.getTimestamp()           Date.now()
OS.ping()                   { status, latency }
OS.loadLibrary(dllPath)     load a .dll module → bool
OS.pid                      current process id
OS.args                     string[] of launch arguments

════════════════════════════════════════
 SDK STDLIB  (obsidian.js, auto-linked)
════════════════════════════════════════
StdIO.print(msg)            alias for OS.print
StdIO.error(msg)            alias for OS.error
FS.read(path)               alias for OS.readFile
FS.write(path, content)     alias for OS.writeFile
FS.ls(path)                 alias for OS.listFiles
Proc.pid                    current pid
Proc.args                   launch args
Proc.exit(code)             alias for OS.terminate
Proc.wait(ms)               alias for OS.wait
Kernel.uptime()             seconds since boot
Kernel.ping()               network ping
print(msg)                  global alias for StdIO.print

════════════════════════════════════════
 HAL.DLL  (OS.HAL.*)
════════════════════════════════════════
OS.HAL.getCpuInfo()         { cores, usage, architecture, vendor, model, features[] }
OS.HAL.getMemoryMap()       { totalPhysical, usedPhysical, freePhysical, pageSize, addressWidth }
OS.HAL.getDiskInfo()        { totalDisk, usedDisk, freeDisk, filesystem, label, driveLetter }
OS.HAL.getNetworkInfo()     { connected, adapter, mac, speed, type }
OS.HAL.getPowerState()      { state, batteryLevel, acConnected, sleepStates[] }
OS.HAL.getSystemTime()      { timestamp, iso, timezone, uptime }
OS.HAL.raiseInterrupt(irq, desc)  → { irq, handled, timestamp }
OS.HAL.queryAcpi(table)     query ACPI table → { table, description, status }

════════════════════════════════════════
 KERNEL32.DLL  (OS.Kernel32.*)
════════════════════════════════════════
Process:
  OS.Kernel32.GetCurrentProcessId()          → pid
  OS.Kernel32.CreateProcess(name,title,icon) → pid
  OS.Kernel32.TerminateProcess(pid,code)     → bool
  OS.Kernel32.GetCommandLine()               → string

Memory:
  OS.Kernel32.VirtualAlloc(size, name)       → bool
  OS.Kernel32.GlobalMemoryStatus()           → { totalPhys, availPhys, usedPhys, loadPercent }

File:
  OS.Kernel32.ReadFile(path)                 → string | undefined
  OS.Kernel32.WriteFile(path, content)       → void
  OS.Kernel32.FindFirstFile(path)            → { found, name, index, all[] }
  OS.Kernel32.FindNextFile(handle)           → { found, name, index, all[] }
  OS.Kernel32.GetFileAttributes(path)        → { exists, size, readonly, system }

Environment:
  OS.Kernel32.GetEnvironmentVariable(name)   → string
  OS.Kernel32.SetEnvironmentVariable(n, v)   → bool
  OS.Kernel32.GetSystemInfo()                → { processorType, numberOfProcessors, pageSize, ... }

Timing:
  OS.Kernel32.Sleep(ms)                      → Promise
  OS.Kernel32.GetTickCount()                 → ms since boot
  OS.Kernel32.QueryPerformanceCounter()      → timestamp

Error:
  OS.Kernel32.GetLastError()                 → error code
  OS.Kernel32.SetLastError(code)             → void
  OS.Kernel32.FormatMessage(code)            → string
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\SDK\\examples\\hello_world.exe',
    'hello_world.exe',
    'C:\\ObsidianOS\\SDK\\examples',
    `
// Hello World Example using SDK
StdIO.print("--- Hello from the SDK ---");
StdIO.print("PID: " + Proc.pid);
StdIO.print("Running on: " + OS.getEnv('OS'));
await Proc.wait(500);
StdIO.print("Closing in 1 second...");
await Proc.wait(1000);
Proc.exit(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\SDK\\examples\\sysdiag.exe',
    'sysdiag.exe',
    'C:\\ObsidianOS\\SDK\\examples',
    `
// sysdiag.exe — System Diagnostics using HAL + Kernel32
print("╔══════════════════════════════════╗");
print("║   ObsidianOS System Diagnostics  ║");
print("╚══════════════════════════════════╝");
await Proc.wait(200);

// CPU via HAL
var cpu = OS.HAL.getCpuInfo();
print("");
print("[ CPU ]");
print("  Model   : " + cpu.model);
print("  Cores   : " + cpu.cores);
print("  Usage   : " + cpu.usage.toFixed(1) + "%");
print("  Features: " + cpu.features.join(", "));
await Proc.wait(150);

// Memory via HAL + Kernel32
var mem = OS.HAL.getMemoryMap();
var memStatus = OS.Kernel32.GlobalMemoryStatus();
print("");
print("[ MEMORY ]");
print("  Total   : " + mem.totalPhysical + " MB");
print("  Used    : " + mem.usedPhysical.toFixed(1) + " MB");
print("  Free    : " + mem.freePhysical.toFixed(1) + " MB");
print("  Load    : " + memStatus.loadPercent + "%");
await Proc.wait(150);

// Disk via HAL
var disk = OS.HAL.getDiskInfo();
print("");
print("[ DISK ]");
print("  Drive   : " + disk.driveLetter + ":");
print("  FS      : " + disk.filesystem);
print("  Total   : " + (disk.totalDisk / 1024).toFixed(0) + " GB");
print("  Free    : " + (disk.freeDisk / 1024).toFixed(0) + " GB");
await Proc.wait(150);

// Network via HAL
var net = OS.HAL.getNetworkInfo();
print("");
print("[ NETWORK ]");
print("  Adapter : " + net.adapter);
print("  Status  : " + (net.connected ? "Connected" : "Disconnected"));
print("  Speed   : " + net.speed);
var pingRes = OS.ping();
print("  Ping    : " + pingRes.latency + "ms");
await Proc.wait(150);

// System time via HAL
var time = OS.HAL.getSystemTime();
print("");
print("[ SYSTEM ]");
print("  Time    : " + time.iso);
print("  Uptime  : " + time.uptime + "s");
print("  PID     : " + OS.Kernel32.GetCurrentProcessId());
print("  CmdLine : " + (OS.Kernel32.GetCommandLine() || "(none)"));
print("");
print("Diagnostics complete.");
Proc.exit(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\SDK\\examples\\calc_gdi.exe',
    'calc_gdi.exe',
    'C:\\ObsidianOS\\SDK\\examples',
    `
// ===================================
// GDI/USER32 Calculator 
// ===================================

// Inicializar interface inicial
OS.User32.CreateLabel('display', '0', 20, 20, 260, 40);
OS.User32.UpdateElementText('display', '<div style="font-size:24px; text-align:right; border:1px solid #000; padding:5px; background:#fff; border-radius:4px">0</div>');

let currentVal = '0';
let op = '';
let lastVal = 0;

function updateDisplay() {
    OS.User32.UpdateElementText('display', '<div style="font-size:24px; text-align:right; border:1px solid #000; padding:5px; background:#fff; border-radius:4px">' + currentVal + '</div>');
}

function handleNum(n) {
    if (currentVal === '0' || currentVal === 'Err') currentVal = n;
    else currentVal += n;
    updateDisplay();
}

function handleOp(o) {
    lastVal = parseFloat(currentVal);
    op = o;
    currentVal = '0';
    updateDisplay();
}

function handleEq() {
    let result = 0;
    let curr = parseFloat(currentVal);
    if(op === '+') result = lastVal + curr;
    if(op === '-') result = lastVal - curr;
    if(op === '*') result = lastVal * curr;
    if(op === '/') result = curr === 0 ? 'Err' : lastVal / curr;
    currentVal = String(result);
    op = '';
    updateDisplay();
}

// Botões numéricos e de oepração
let keys = [
  ['7','8','9','/'],
  ['4','5','6','*'],
  ['1','2','3','-'],
  ['0','C','=','+']
];

for(let r=0; r<4; r++) {
   for(let c=0; c<4; c++) {
      let k = keys[r][c];
      let id = 'btn_' + k;
      OS.User32.CreateButton(id, k, 20 + c*65, 80 + r*65, 60, 60);
      OS.User32.OnMessage(id, 'click', function() {
          if(k === 'C') { currentVal = '0'; lastVal = 0; op = ''; updateDisplay(); }
          else if(k === '=') { handleEq(); }
          else if(['+','-','*','/'].indexOf(k) !== -1) { handleOp(k); }
          else { handleNum(k); }
      });
   }
}

// Rodar para sempre!
await OS.User32.MessageLoop();
    `.trim()
  ]
];

const appExes: [string, string, string, string, string, string, string][] = [
  ['C:\\Program Files\\ObsidianOS Apps\\notepad.exe', 'notepad.exe', 'C:\\Program Files\\ObsidianOS Apps', 'notepad', '📝', 'productivity', 'Bloco de Notas'],
  ['C:\\Program Files\\ObsidianOS Apps\\calc.exe', 'calc.exe', 'C:\\Program Files\\ObsidianOS Apps', 'calculator', '🧮', 'utilities', 'Calculadora'],
  ['C:\\Program Files\\ObsidianOS Apps\\cmd.exe', 'cmd.exe', 'C:\\Program Files\\ObsidianOS Apps', 'terminal', '💻', 'system', 'Terminal'],
  ['C:\\Program Files\\ObsidianOS Apps\\explorer.exe', 'explorer.exe', 'C:\\Program Files\\ObsidianOS Apps', 'file-explorer', '📁', 'system', 'Explorador de Arquivos'],
  ['C:\\Program Files\\ObsidianOS Apps\\control.exe', 'control.exe', 'C:\\Program Files\\ObsidianOS Apps', 'settings', '⚙️', 'system', 'Configurações'],
  ['C:\\Program Files\\ObsidianOS Apps\\taskmgr.exe', 'taskmgr.exe', 'C:\\Program Files\\ObsidianOS Apps', 'task-manager', '📊', 'system', 'Gerenciador de Tarefas'],
  ['C:\\Program Files\\ObsidianOS Apps\\msedge.exe', 'msedge.exe', 'C:\\Program Files\\ObsidianOS Apps', 'browser', '🌐', 'productivity', 'Navegador Web'],
  ['C:\\Program Files\\ObsidianOS Apps\\regedit.exe', 'regedit.exe', 'C:\\Program Files\\ObsidianOS Apps', 'regedit', '🧊', 'system', 'Editor do Registro'],
  ['C:\\Program Files\\ObsidianOS Apps\\ocode.exe', 'ocode.exe', 'C:\\Program Files\\ObsidianOS Apps', 'obsidian-code', '⚡', 'productivity', 'Obsidian Code'],
  ['C:\\Program Files\\ObsidianOS Apps\\obsrecord.exe', 'obsrecord.exe', 'C:\\Program Files\\ObsidianOS Apps', 'obs-record', '🎥', 'multimedia', 'ObS Record'],
];

systemExes.forEach(([path, name, parent, desc]) => {
  defaultNodes[path] = makeSysExe(path, name, parent, desc);
});

appExes.forEach(([path, name, parent, appId, icon, cat, display]) => {
  defaultNodes[path] = makeAppExe(path, name, parent, appId, icon, cat, display);
});

binaryExes.forEach(([path, name, parent, code]) => {
  defaultNodes[path] = makeBinaryExe(path, name, parent, code);
});

// =====================================================
// DLL MODULES — Real JS modules loaded by bootmgr.exe
// They attach namespaces onto the OS object in the sandbox
// =====================================================
const dllModules: [string, string, string, string][] = [
  [
    'C:\\ObsidianOS\\System32\\hal.dll',
    'hal.dll',
    'C:\\ObsidianOS\\System32',
    `
// ============================================
// hal.dll — Hardware Abstraction Layer
// Attaches OS.HAL namespace to the sandbox.
// Provides a uniform interface to physical hardware
// regardless of underlying platform differences.
// ============================================
OS.HAL = {
  // CPU information
  getCpuInfo: function() {
    var res = OS.getResources();
    return {
      cores: res.cpuCores,
      usage: res.cpuUsage,
      architecture: 'x86_64',
      vendor: 'ObsidianCorp',
      model: 'Virtual CPU @ 3.20GHz',
      features: ['SSE4.2', 'AVX2', 'AES-NI', 'RDRAND']
    };
  },

  // Memory map
  getMemoryMap: function() {
    var res = OS.getResources();
    return {
      totalPhysical: res.totalMemory,
      usedPhysical: res.usedMemory,
      freePhysical: res.totalMemory - res.usedMemory,
      pageSize: 4096,
      addressWidth: 48
    };
  },

  // Disk info
  getDiskInfo: function() {
    var res = OS.getResources();
    return {
      totalDisk: res.totalDisk,
      usedDisk: res.usedDisk,
      freeDisk: res.totalDisk - res.usedDisk,
      filesystem: 'NTFS',
      label: 'ObsidianOS',
      driveLetter: 'C'
    };
  },

  // Network hardware
  getNetworkInfo: function() {
    var res = OS.getResources();
    return {
      connected: res.networkUp,
      adapter: 'ObsidianNet Virtual Adapter',
      mac: 'OB:5I:D1:AN:0S:NT',
      speed: '1 Gbps',
      type: 'Ethernet'
    };
  },

  // Hardware interrupt controller
  raiseInterrupt: function(irq, description) {
    OS.addBootLog('HAL: IRQ ' + irq + ' -> ' + description);
    return { irq: irq, handled: true, timestamp: OS.getTimestamp() };
  },

  // Power management
  getPowerState: function() {
    return {
      state: 'S0',
      batteryLevel: 85,
      acConnected: true,
      sleepStates: ['S1', 'S3', 'S4', 'S5']
    };
  },

  // Timer / clock
  getSystemTime: function() {
    var ts = OS.getTimestamp();
    return {
      timestamp: ts,
      iso: new Date(ts).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      uptime: OS.getResources().uptime
    };
  },

  // ACPI query
  queryAcpi: function(table) {
    var tables = { DSDT: 'Differentiated System Description Table', FADT: 'Fixed ACPI Description Table', MADT: 'Multiple APIC Description Table', SSDT: 'Secondary System Description Table' };
    return { table: table, description: tables[table] || 'Unknown ACPI Table', status: 'present' };
  }
};
`.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\kernel32.dll',
    'kernel32.dll',
    'C:\\ObsidianOS\\System32',
    `
// ============================================
// kernel32.dll — Windows Base API
// Attaches OS.Kernel32 namespace to the sandbox.
// Provides process, memory, file, sync, and
// environment management APIs.
// ============================================
OS.Kernel32 = {
  // ── Process API ──────────────────────────────
  GetCurrentProcessId: function() {
    return OS.pid;
  },

  CreateProcess: function(name, title, icon) {
    return OS.createProcess(name, title, icon || '⚙️');
  },

  TerminateProcess: function(pid, exitCode) {
    OS.terminate(exitCode || 0);
    return true;
  },

  GetCommandLine: function() {
    return OS.args.join(' ');
  },

  // ── Memory API ───────────────────────────────
  VirtualAlloc: function(size, name) {
    return OS.allocateMemory(size, name || 'VirtualAlloc');
  },

  GlobalMemoryStatus: function() {
    var mem = OS.getResources();
    return {
      totalPhys: mem.totalMemory,
      availPhys: mem.totalMemory - mem.usedMemory,
      usedPhys: mem.usedMemory,
      loadPercent: Math.round((mem.usedMemory / mem.totalMemory) * 100)
    };
  },

  // ── File API ─────────────────────────────────
  ReadFile: function(path) {
    return OS.readFile(path);
  },

  WriteFile: function(path, content) {
    return OS.writeFile(path, content);
  },

  FindFirstFile: function(path) {
    var files = OS.listFiles(path);
    return files.length > 0 ? { found: true, name: files[0], index: 0, all: files } : { found: false };
  },

  FindNextFile: function(handle) {
    if (!handle || !handle.all) return { found: false };
    handle.index++;
    return handle.index < handle.all.length
      ? { found: true, name: handle.all[handle.index], index: handle.index, all: handle.all }
      : { found: false };
  },

  GetFileAttributes: function(path) {
    var content = OS.readFile(path);
    return content !== undefined
      ? { exists: true, size: content.length, readonly: false, system: path.includes('System32') }
      : { exists: false };
  },

  // ── Environment API ──────────────────────────
  GetEnvironmentVariable: function(name) {
    var env = { OS: 'ObsidianOS_NT', COMPUTERNAME: 'OBSIDIAN-PC', USERNAME: OS.getEnv('USER'), SYSTEMROOT: 'C:\\\\ObsidianOS', TEMP: 'C:\\\\ObsidianOS\\\\Temp', PATH: 'C:\\\\ObsidianOS\\\\System32;C:\\\\ObsidianOS\\\\SDK\\\\examples', PROCESSOR_ARCHITECTURE: 'AMD64', NUMBER_OF_PROCESSORS: String(OS.getResources().cpuCores) };
    return env[name] || '';
  },

  SetEnvironmentVariable: function(name, value) {
    OS.print('[Kernel32] SetEnvironmentVariable: ' + name + '=' + value);
    return true;
  },

  GetSystemInfo: function() {
    var res = OS.getResources();
    return {
      processorType: 'PROCESSOR_AMD64',
      numberOfProcessors: res.cpuCores,
      pageSize: 4096,
      processorLevel: 6,
      processorRevision: 0x0A00,
      allocationGranularity: 65536
    };
  },

  // ── Sync / Timing API ────────────────────────
  Sleep: function(ms) {
    return OS.wait(ms);
  },

  GetTickCount: function() {
    return OS.getResources().uptime * 1000;
  },

  QueryPerformanceCounter: function() {
    return OS.getTimestamp();
  },

  // ── Error API ────────────────────────────────
  GetLastError: function() { return 0; },
  SetLastError: function(code) { OS.error('[Kernel32] SetLastError: ' + code); },

  FormatMessage: function(code) {
    var messages = { 0: 'The operation completed successfully.', 2: 'The system cannot find the file specified.', 5: 'Access is denied.', 8: 'Not enough memory resources.', 32: 'The process cannot access the file.', 87: 'The parameter is incorrect.' };
    return messages[code] || 'Unknown error code: ' + code;
  }
};
`.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\gdi32.dll',
    'gdi32.dll',
    'C:\\ObsidianOS\\System32',
    `
// ============================================
// gdi32.dll — Graphics Device Interface
// Attaches OS.GDI32 namespace to the sandbox
// Emits drawing instructions to HwndRenderer
// ============================================
OS.GDI32 = {
  internalQueue: [],
  
  // Buffers a draw command
  __queue: function(op, args) {
     this.internalQueue.push(Object.assign({ op: op }, args));
  },
  
  // Flushes commands to the React canvas
  Flush: function() {
     if (this.internalQueue.length > 0) {
        kernel.emit('gdi:draw', { pid: OS.pid, commands: this.internalQueue });
        this.internalQueue = [];
     }
  },

  SetFillStyle: function(color) { this.__queue('fillStyle', { color: color }); },
  FillRect: function(x, y, w, h) { this.__queue('fillRect', { x: x, y: y, w: w, h: h }); },
  ClearRect: function(x, y, w, h) { this.__queue('clearRect', { x: x, y: y, w: w, h: h }); },
  SetFont: function(font) { this.__queue('font', { font: font }); },
  DrawText: function(text, x, y) { this.__queue('fillText', { text: String(text), x: x, y: y }); }
};
`.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\user32.dll',
    'user32.dll',
    'C:\\ObsidianOS\\System32',
    `
// ============================================
// user32.dll — Window & UI Manager
// Attaches OS.User32 namespace to the sandbox
// ============================================
OS.User32 = {
  elements: [],
  listeners: {},

  // Switch display mode to DOM
  SetRenderMode: function(mode) {
    kernel.emit('user32:set_mode', { pid: OS.pid, mode: mode });
  },

  // Renders the virtual DOM tree
  __renderDOM: function() {
    var html = this.elements.map(function(el) {
       var style = "position:absolute;left:" + el.x + "px;top:" + el.y + "px;";
       if (el.width) style += "width:" + el.width + "px;";
       if (el.height) style += "height:" + el.height + "px;";
       
       if (el.type === 'button') {
          return "<button id='" + el.id + "' style='" + style + "'>" + el.text + "</button>";
       } else if (el.type === 'input') {
          return "<input id='" + el.id + "' style='" + style + "' value='" + (el.text || '') + "' />";
       } else if (el.type === 'label') {
          return "<div id='" + el.id + "' style='" + style + "'>" + el.text + "</div>";
       }
       return "";
    }).join("");
    kernel.emit('user32:dom_update', { pid: OS.pid, html: html });
  },

  CreateElement: function(type, id, x, y, width, height, text) {
    // If it exists, update it
    var existing = this.elements.findIndex(function(e) { return e.id === id; });
    var obj = { type: type, id: id, x: x, y: y, width: width, height: height, text: text };
    if (existing >= 0) this.elements[existing] = obj;
    else this.elements.push(obj);
    
    this.__renderDOM();
  },

  UpdateElementText: function(id, text) {
    var existing = this.elements.find(function(e) { return e.id === id; });
    if (existing) {
       existing.text = text;
       this.__renderDOM();
    }
  },

  CreateButton: function(id, text, x, y, width, height) {
    this.CreateElement('button', id, x, y, width, height, text);
  },

  CreateLabel: function(id, text, x, y, width, height) {
    this.CreateElement('label', id, x, y, width, height, text);
  },

  CreateInput: function(id, text, x, y, width, height) {
    this.CreateElement('input', id, x, y, width, height, text);
  },

  OnMessage: function(id, eventType, callback) {
    if (!this.listeners[id]) this.listeners[id] = {};
    this.listeners[id][eventType.toLowerCase()] = callback;
  },

  // The Message Loop that listens to events from HwndRenderer
  MessageLoop: async function() {
    this.SetRenderMode('dom');
    this.__renderDOM();
    
    // Register global listener for DOM events from HwndRenderer
    kernel.on('user32:dom_event', function(data) {
       if (data.pid === OS.pid) {
          if (OS.User32.listeners[data.elementId] && OS.User32.listeners[data.elementId][data.event]) {
             OS.User32.listeners[data.elementId][data.event](data);
          }
       }
    });

    // Run indefinitely (until process terminated)
    while (true) {
       await OS.wait(100);
    }
  }
};
`.trim()
  ]
];

dllModules.forEach(([path, name, parent, code]) => {
  defaultNodes[path] = makeBinaryExe(path, name, parent, code);
});

sdkFiles.forEach(([path, name, parent, code]) => {
  if (path.endsWith('.exe')) {
     defaultNodes[path] = makeBinaryExe(path, name, parent, code);
  } else {
     defaultNodes[path] = makeFile(path, name, parent, path.split('.').pop() || 'txt', code);
  }
});

// =====================================================
// DRIVERS - loaded during boot, depend on file existence
// =====================================================
const driverFiles: [string, string, string, string][] = [
  ['C:\\ObsidianOS\\System32\\drivers\\disk.sys', 'disk.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Disk Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\acpi.sys', 'acpi.sys', 'C:\\ObsidianOS\\System32\\drivers', 'ACPI Driver for NT'],
  ['C:\\ObsidianOS\\System32\\drivers\\pci.sys', 'pci.sys', 'C:\\ObsidianOS\\System32\\drivers', 'PCI Bus Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\display.sys', 'display.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Display Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\hid.sys', 'hid.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Human Interface Device Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\kbdclass.sys', 'kbdclass.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Keyboard Class Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\mouclass.sys', 'mouclass.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Mouse Class Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\netio.sys', 'netio.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Network I/O Subsystem'],
  ['C:\\ObsidianOS\\System32\\drivers\\tcpip.sys', 'tcpip.sys', 'C:\\ObsidianOS\\System32\\drivers', 'TCP/IP Protocol Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\ndis.sys', 'ndis.sys', 'C:\\ObsidianOS\\System32\\drivers', 'NDIS System Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\hdaudio.sys', 'hdaudio.sys', 'C:\\ObsidianOS\\System32\\drivers', 'High Definition Audio Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\fltMgr.sys', 'fltMgr.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Filter Manager Driver'],
  ['C:\\ObsidianOS\\System32\\drivers\\Wdf01000.sys', 'Wdf01000.sys', 'C:\\ObsidianOS\\System32\\drivers', 'WDF Framework'],
];

driverFiles.forEach(([path, name, parent, desc]) => {
  defaultNodes[path] = makeSysExe(path, name, parent, desc);
});

// =====================================================
// USER FILES
// =====================================================
const files: [string, string, string, string, string, number][] = [
  ['C:\\Users\\User\\Desktop\\readme.txt', 'readme.txt', 'C:\\Users\\User\\Desktop', 'txt', 'Welcome to ObsidianOS!\n\nThis is your new operating system, built entirely in the browser.\nExplore the Start Menu, open apps, and customize your experience.\n\n⚠ WARNING: Do not delete system files in C:\\ObsidianOS\\System32!\nDoing so WILL cause boot failure and BSOD on next restart.', 0],
  ['C:\\Users\\User\\Documents\\notes.txt', 'notes.txt', 'C:\\Users\\User\\Documents', 'txt', 'My Notes\n========\n\n- Learn ObsidianOS\n- Customize desktop\n- Try the terminal\n- Open Task Manager to see real processes\n- Use "reg query" in terminal to browse registry', 0],
  ['C:\\Users\\User\\Documents\\project.js', 'project.js', 'C:\\Users\\User\\Documents', 'js', '// ObsidianOS Project\nconsole.log("Hello from ObsidianOS!");\n\nfunction main() {\n  return "Welcome to ObsidianOS";\n}\n\nmain();', 0],
  ['C:\\Users\\User\\Documents\\report.html', 'report.html', 'C:\\Users\\User\\Documents', 'html', '<!DOCTYPE html>\n<html>\n<head><title>Report</title></head>\n<body>\n<h1>ObsidianOS Report</h1>\n<p>System running smoothly.</p>\n</body>\n</html>', 0],
];

files.forEach(([path, name, parent, ext, content, size]) => {
  defaultNodes[path] = makeFile(path, name, parent, ext, content, size);
});

// System config files — marked as system so fsStartupRepair can restore them
const sysConfigFiles: [string, string, string, string, string][] = [
  ['C:\\ObsidianOS\\System32\\win.ini', 'win.ini', 'C:\\ObsidianOS\\System32', 'ini', '; ObsidianOS System Configuration\n[ObsidianOS]\nload=\nrun=\n[Desktop]\nWallpaper=default\nTileWallpaper=0'],
  ['C:\\ObsidianOS\\System32\\boot.ini', 'boot.ini', 'C:\\ObsidianOS\\System32', 'ini', '[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\OBSIDIANOS\n[operating systems]\nmulti(0)disk(0)rdisk(0)partition(1)\\OBSIDIANOS="ObsidianOS Professional" /fastdetect'],
  ['C:\\ObsidianOS\\System32\\config\\SYSTEM', 'SYSTEM', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SYSTEM\nLastWritten=' + now],
  ['C:\\ObsidianOS\\System32\\config\\SOFTWARE', 'SOFTWARE', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SOFTWARE\nLastWritten=' + now],
  ['C:\\ObsidianOS\\System32\\config\\SAM', 'SAM', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SAM\nSecurity=ENCRYPTED\nLastWritten=' + now],
  ['C:\\ObsidianOS\\System32\\config\\SECURITY', 'SECURITY', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SECURITY\nLastWritten=' + now],
];

sysConfigFiles.forEach(([path, name, parent, ext, content]) => {
  defaultNodes[path] = makeSysFile(path, name, parent, ext, content);
});
