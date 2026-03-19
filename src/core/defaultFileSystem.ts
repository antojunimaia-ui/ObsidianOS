// ============================================
// Virtual File System Store
// ============================================
import type { FileSystemNode } from '../types';

const now = Date.now();

const defaultPermissions = { read: true, write: true, execute: false, hidden: false, system: false };
const defaultAttributes = { isReadOnly: false, isHidden: false, isSystem: false, isArchive: false };
const sysPermissions = { read: true, write: false, execute: true, hidden: false, system: true };
const sysAttributes = { isReadOnly: true, isHidden: false, isSystem: true, isArchive: false };

function makeDir(path: string, name: string, parentPath: string, sys = false): FileSystemNode {
  return {
    id: path, name, type: 'directory', path, parentPath, size: 0,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: sys ? sysPermissions : defaultPermissions,
    attributes: sys ? sysAttributes : defaultAttributes,
    children: [],
  };
}

function makeFile(path: string, name: string, parentPath: string, ext: string, content = '', size = 0): FileSystemNode {
  return {
    id: path, name, type: 'file', path, parentPath, size: size || content.length,
    extension: ext, content,
    createdAt: now, modifiedAt: now, accessedAt: now,
    permissions: defaultPermissions, attributes: defaultAttributes,
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

// Build a realistic file system
const defaultNodes: Record<string, FileSystemNode> = {};

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
] as const;

dirs.forEach(([path, name, parent, sys]) => {
  defaultNodes[path as string] = makeDir(path as string, name as string, parent as string, sys as boolean);
});

// =====================================================
// CRITICAL SYSTEM EXECUTABLES - boot depends on these!
// Deleting any of these will cause boot failure / BSOD
// =====================================================
const systemExes: [string, string, string, string][] = [
  // Kernel & core
  ['C:\\ObsidianOS\\System32\\ntoskrnl.exe', 'ntoskrnl.exe', 'C:\\ObsidianOS\\System32', 'ObsidianOS NT Kernel'],
  ['C:\\ObsidianOS\\System32\\hal.dll', 'hal.dll', 'C:\\ObsidianOS\\System32', 'Hardware Abstraction Layer'],
  ['C:\\ObsidianOS\\System32\\csrss.exe', 'csrss.exe', 'C:\\ObsidianOS\\System32', 'Client/Server Runtime Subsystem'],
  ['C:\\ObsidianOS\\System32\\smss.exe', 'smss.exe', 'C:\\ObsidianOS\\System32', 'Session Manager Subsystem'],
  ['C:\\ObsidianOS\\System32\\winlogon.exe', 'winlogon.exe', 'C:\\ObsidianOS\\System32', 'Windows Logon Application'],
  ['C:\\ObsidianOS\\System32\\services.exe', 'services.exe', 'C:\\ObsidianOS\\System32', 'Services and Controller App'],
  ['C:\\ObsidianOS\\System32\\lsass.exe', 'lsass.exe', 'C:\\ObsidianOS\\System32', 'Local Security Authority Process'],
  ['C:\\ObsidianOS\\System32\\svchost.exe', 'svchost.exe', 'C:\\ObsidianOS\\System32', 'Host Process for Services'],
  ['C:\\ObsidianOS\\System32\\dwm.exe', 'dwm.exe', 'C:\\ObsidianOS\\System32', 'Desktop Window Manager'],
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
  // DLLs
  ['C:\\ObsidianOS\\System32\\kernel32.dll', 'kernel32.dll', 'C:\\ObsidianOS\\System32', 'ObsidianOS BASE API Client DLL'],
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

const appExes: [string, string, string, string, string, string, string][] = [
  ['C:\\Program Files\\ObsidianOS Apps\\notepad.exe', 'notepad.exe', 'C:\\Program Files\\ObsidianOS Apps', 'notepad', '📝', 'productivity', 'Bloco de Notas'],
  ['C:\\Program Files\\ObsidianOS Apps\\calc.exe', 'calc.exe', 'C:\\Program Files\\ObsidianOS Apps', 'calculator', '🧮', 'utilities', 'Calculadora'],
  ['C:\\Program Files\\ObsidianOS Apps\\cmd.exe', 'cmd.exe', 'C:\\Program Files\\ObsidianOS Apps', 'terminal', '💻', 'system', 'Terminal'],
  ['C:\\Program Files\\ObsidianOS Apps\\explorer.exe', 'explorer.exe', 'C:\\Program Files\\ObsidianOS Apps', 'file-explorer', '📁', 'system', 'Explorador de Arquivos'],
  ['C:\\Program Files\\ObsidianOS Apps\\control.exe', 'control.exe', 'C:\\Program Files\\ObsidianOS Apps', 'settings', '⚙️', 'system', 'Configurações'],
  ['C:\\Program Files\\ObsidianOS Apps\\taskmgr.exe', 'taskmgr.exe', 'C:\\Program Files\\ObsidianOS Apps', 'task-manager', '📊', 'system', 'Gerenciador de Tarefas'],
  ['C:\\Program Files\\ObsidianOS Apps\\msedge.exe', 'msedge.exe', 'C:\\Program Files\\ObsidianOS Apps', 'browser', '🌐', 'productivity', 'Navegador Web'],
  ['C:\\Program Files\\ObsidianOS Apps\\regedit.exe', 'regedit.exe', 'C:\\Program Files\\ObsidianOS Apps', 'regedit', '🧊', 'system', 'Editor do Registro'],
];

systemExes.forEach(([path, name, parent, desc]) => {
  defaultNodes[path] = makeSysExe(path, name, parent, desc);
});

appExes.forEach(([path, name, parent, appId, icon, cat, display]) => {
  defaultNodes[path] = makeAppExe(path, name, parent, appId, icon, cat, display);
});

// =====================================================
// DRIVERS - loaded during boot, depend on file existence
// =====================================================
const driverFiles: [string, string, string, string][] = [
  ['C:\\ObsidianOS\\System32\\drivers\\ntfs.sys', 'ntfs.sys', 'C:\\ObsidianOS\\System32\\drivers', 'NTFS File System Driver'],
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
  ['C:\\ObsidianOS\\System32\\drivers\\volmgr.sys', 'volmgr.sys', 'C:\\ObsidianOS\\System32\\drivers', 'Volume Manager Driver'],
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
  // System configuration files
  ['C:\\ObsidianOS\\System32\\win.ini', 'win.ini', 'C:\\ObsidianOS\\System32', 'ini', '; ObsidianOS System Configuration\n[ObsidianOS]\nload=\nrun=\n[Desktop]\nWallpaper=default\nTileWallpaper=0', 0],
  ['C:\\ObsidianOS\\System32\\boot.ini', 'boot.ini', 'C:\\ObsidianOS\\System32', 'ini', '[boot loader]\ntimeout=30\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\OBSIDIANOS\n[operating systems]\nmulti(0)disk(0)rdisk(0)partition(1)\\OBSIDIANOS="ObsidianOS Professional" /fastdetect', 0],
  ['C:\\ObsidianOS\\System32\\config\\SYSTEM', 'SYSTEM', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SYSTEM\nLastWritten=' + now, 0],
  ['C:\\ObsidianOS\\System32\\config\\SOFTWARE', 'SOFTWARE', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SOFTWARE\nLastWritten=' + now, 0],
  ['C:\\ObsidianOS\\System32\\config\\SAM', 'SAM', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SAM\nSecurity=ENCRYPTED\nLastWritten=' + now, 0],
  ['C:\\ObsidianOS\\System32\\config\\SECURITY', 'SECURITY', 'C:\\ObsidianOS\\System32\\config', 'dat', '[Registry Hive]\nType=SECURITY\nLastWritten=' + now, 0],
];

files.forEach(([path, name, parent, ext, content, size]) => {
  defaultNodes[path] = makeFile(path, name, parent, ext, content, size);
});

export { defaultNodes, makeFile, makeDir };
