export const binaryExes: [string, string, string, string][] = [
  [
    'C:\\ObsidianOS\\System32\\ping.obx', 
    'ping.obx', 
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
    'C:\\ObsidianOS\\System32\\ls.obx', 
    'ls.obx', 
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
    'C:\\ObsidianOS\\System32\\sysinfo.obx', 
    'sysinfo.obx', 
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
    'C:\\ObsidianOS\\System32\\bootmgr.obx',
    'bootmgr.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.addBootLog('BootMgr: Initializing boot flow...');
var pt = kernel.getPartitionTable();
var bc = kernel.getBootConfig();
if (pt) {
  OS.addBootLog('BootMgr: Disk scheme: ' + pt.scheme + ' (' + pt.diskLabel + ')');
  pt.partitions.forEach(function(p) {
    if (p.driveLetter) OS.addBootLog('BootMgr: Partition ' + p.index + ': ' + p.driveLetter + ': [' + p.type + '] ' + p.sizeMB + 'MB "' + p.label + '"');
  });
}
if (bc) {
  OS.addBootLog('BootMgr: Boot scheme: ' + bc.scheme + ' | Default: ' + bc.defaultEntry + ' | Timeout: ' + bc.timeout + 's');
  var defaultEntry = bc.entries.find(function(e) { return e.id === bc.defaultEntry; });
  if (defaultEntry) OS.addBootLog('BootMgr: Loading -> ' + defaultEntry.label);
}
var bootConfig = OS.readFile('C:\\\\ObsidianOS\\\\System32\\\\boot.ini');
if (!bootConfig) { OS.triggerBSOD({ stopCode: 'BOOT_LOADER_FAILURE', technicalInfo: 'boot.ini missing' }); return; }
var defaultArcMatch = bootConfig.match(/default=(.*)/i);
var arcPath = defaultArcMatch ? defaultArcMatch[1].trim() : '';
OS.addBootLog('BootMgr: ARC Path -> ' + arcPath);
if (!arcPath.includes('partition(1)')) { OS.triggerBSOD({ stopCode: 'INACCESSIBLE_BOOT_DEVICE', technicalInfo: 'Arc Path Partition Fail' }); return; }
var sysRootMatch = arcPath.match(/partition[(]1[)]\\\\(.*)/i);
var sysRoot = (sysRootMatch && sysRootMatch[1]) ? sysRootMatch[1].trim() : 'ObsidianOS';
var files = OS.listFiles('C:');
var actualRoot = files.find(function(f) { return f.toLowerCase() === sysRoot.toLowerCase(); });
if (!actualRoot) { OS.triggerBSOD({ stopCode: 'BOOT_LOADER_FAILURE', technicalInfo: 'System folder not found: ' + sysRoot }); return; }
OS.addBootLog('BootMgr: System Root -> C:\\\\' + actualRoot + ' [OK]');
OS.setBootPhase('KERNEL_INIT');
OS.addBootLog('BootMgr: Loading ntoskrnl.obx...');
var kernelCode = OS.readFile('C:\\\\' + actualRoot + '\\\\System32\\\\ntoskrnl.obx');
if (!kernelCode) { OS.triggerBSOD({ stopCode: 'KERNEL_DATA_INPAGE_ERROR', technicalInfo: 'ntoskrnl.obx missing' }); return; }
OS.allocateMemory(64, 'ntoskrnl.obx');
OS.createProcess('System', 'System Process', '⚙️');
OS.addBootLog('BootMgr: Loading kernel32.dll...');
var k32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\kernel32.dll');
if (!k32ok) { OS.triggerBSOD({ stopCode: 'KERNEL32_INIT_FAILED', technicalInfo: 'kernel32.dll failed to load', failedComponent: 'kernel32.dll', bugCheckCode: '0x0000007B', parameters: ['kernel32.dll'] }); return; }
OS.allocateMemory(12, 'kernel32.dll');
OS.addBootLog('  ✓ kernel32.dll');
OS.addBootLog('BootMgr: Loading gdi32.dll...');
var gdi32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\gdi32.dll');
if (!gdi32ok) { OS.triggerBSOD({ stopCode: 'GDI32_INIT_FAILED', technicalInfo: 'gdi32.dll failed to load', failedComponent: 'gdi32.dll', bugCheckCode: '0x0000007C', parameters: ['gdi32.dll'] }); return; }
OS.allocateMemory(8, 'gdi32.dll');
OS.addBootLog('  ✓ gdi32.dll');
OS.addBootLog('BootMgr: Loading user32.dll...');
var user32ok = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\user32.dll');
if (!user32ok) { OS.triggerBSOD({ stopCode: 'USER32_INIT_FAILED', technicalInfo: 'user32.dll failed to load', failedComponent: 'user32.dll', bugCheckCode: '0x0000007D', parameters: ['user32.dll'] }); return; }
OS.allocateMemory(10, 'user32.dll');
OS.addBootLog('  ✓ user32.dll');
OS.setBootPhase('HAL_INIT');
OS.addBootLog('BootMgr: Loading hal.dll...');
var halOk = OS.loadLibrary('C:\\\\ObsidianOS\\\\System32\\\\hal.dll');
if (!halOk) { OS.triggerBSOD({ stopCode: 'HAL_INITIALIZATION_FAILED', technicalInfo: 'hal.dll failed to initialize', failedComponent: 'hal.dll', bugCheckCode: '0x0000005C', parameters: ['hal.dll'] }); return; }
OS.allocateMemory(8, 'hal.dll');
OS.addBootLog('  ✓ hal.dll');
OS.setBootPhase('DRIVER_LOAD');
OS.addBootLog('BootMgr: Loading drivers...');
OS.addBootLog('  Loading volmgr.sys...');
var volmgrOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\volmgr.sys');
if (!volmgrOk) { OS.triggerBSOD({ stopCode: 'VOLMGR_FAILED', technicalInfo: 'Volume Manager failed to initialize. Disk cannot be mounted.', failedComponent: 'volmgr.sys', bugCheckCode: '0x0000006B', parameters: ['volmgr.sys'] }); return; }
OS.addBootLog('  ✓ volmgr.sys');
OS.addBootLog('  Loading ntfs.sys...');
var ntfsOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\ntfs.sys');
if (!ntfsOk) { OS.triggerBSOD({ stopCode: 'NTFS_FILE_SYSTEM', technicalInfo: 'NTFS driver failed to initialize.', failedComponent: 'ntfs.sys', bugCheckCode: '0x00000024', parameters: ['ntfs.sys'] }); return; }
OS.addBootLog('  ✓ ntfs.sys');
OS.addBootLog('  Loading vss.sys...');
var vssOk = await OS.loadDriverAsync('C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\vss.sys');
if (vssOk) { OS.addBootLog('  ✓ vss.sys'); } else { OS.addBootLog('  ! vss.sys failed (non-critical)'); }
var passiveDrivers = ['disk.sys', 'display.sys', 'hid.sys', 'netio.sys'];
for (var d = 0; d < passiveDrivers.length; d++) {
  OS.registerDriver({ name: passiveDrivers[d], status: 'loaded', type: 'kernel' });
  OS.addBootLog('  ✓ ' + passiveDrivers[d]);
}
OS.setBootPhase('SERVICE_INIT');
OS.addBootLog('BootMgr: Spawning smss.obx (Session Manager)...');
OS.spawn('smss.obx', 'Session Manager Subsystem', '⚙️', 'C:\\\\ObsidianOS\\\\System32\\\\smss.obx');
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
OS.addBootLog('volmgr: Initializing Volume Manager...');
const available = await kernel.opfsDriver.isAvailable();
if (!available) { OS.error('volmgr: OPFS not available in this browser.'); OS.terminate(1); return; }
const diskExists = await kernel.opfsDriver.diskExists();
if (!diskExists) {
  OS.addBootLog('volmgr: No disk found. Formatting virtual disk...');
  const defaultNodes = await kernel.getDefaultNodes();
  await kernel.opfsDriver.formatDisk(defaultNodes);
  OS.addBootLog('volmgr: Format complete. Volume C: created.');
} else { OS.addBootLog('volmgr: Existing disk found. Mounting C:...'); }
OS.registerDriver({ name: 'volmgr', path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\volmgr.sys', status: 'loaded', type: 'storage', loadOrder: 1, dependencies: [] });
OS.addBootLog('volmgr: Volume C: mounted [OPFS]');
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\drivers\\ntfs.sys',
    'ntfs.sys',
    'C:\\ObsidianOS\\System32\\drivers',
    `
OS.addBootLog('ntfs: Initializing NTFS driver...');
await kernel.registerFsDriver(kernel.opfsDriver);
const alreadyHydrated = kernel.getFsNodeCount() > 0 && kernel.isDiskDriverActive();
if (!alreadyHydrated) {
  OS.addBootLog('ntfs: Hydrating filesystem cache...');
  const count = await kernel.hydrateFromDisk();
  OS.addBootLog('ntfs: Loaded ' + count + ' nodes into cache.');
} else { OS.addBootLog('ntfs: Cache already loaded (' + kernel.getFsNodeCount() + ' nodes).'); }
OS.registerDriver({ name: 'ntfs', path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\ntfs.sys', status: 'loaded', type: 'filesystem', loadOrder: 2, dependencies: ['volmgr'] });
OS.addBootLog('ntfs: NTFS driver ready.');
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\drivers\\vss.sys',
    'vss.sys',
    'C:\\ObsidianOS\\System32\\drivers',
    `
OS.addBootLog('vss: Volume Shadow Copy Service starting...');
const SNAPSHOT_FILE = 'C:\\\\System Volume Information\\\\VSS\\\\snapshot.json';
const snapshot = {};
let count = 0;
kernel._filesystem.forEach(function(node, path) {
  if (node.attributes && node.attributes.isSystem && node.type === 'file' && node.content) {
    snapshot[path] = node.content;
    count++;
  }
});
OS.writeFile(SNAPSHOT_FILE, JSON.stringify({ timestamp: Date.now(), files: snapshot }));
OS.addBootLog('vss: Snapshot created (' + count + ' system files)');
OS.registerDriver({ name: 'vss', path: 'C:\\\\ObsidianOS\\\\System32\\\\drivers\\\\vss.sys', status: 'loaded', type: 'storage', loadOrder: 3, dependencies: ['ntfs'] });
OS.terminate(0);
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\smss.obx',
    'smss.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[smss] Session Manager Subsystem starting...');
OS.registerCritical('SUBSYSTEM_INIT_FAILURE', 'Session Manager Subsystem failed. All subsystems collapsing.', 'smss.obx', '0x0000006E');
OS.addBootLog('smss: Registering as critical process... OK');
OS.addBootLog('smss: Spawning csrss.obx (Client Server Runtime)...');
OS.spawn('csrss.obx', 'Client Server Runtime Process', '⚙️', 'C:\\\\ObsidianOS\\\\System32\\\\csrss.obx');
await OS.wait(100);
OS.addBootLog('smss: Spawning wininit.obx (Start-Up Application)...');
OS.spawn('wininit.obx', 'ObsidianOS Start-Up Application', '⚙️', 'C:\\\\ObsidianOS\\\\System32\\\\wininit.obx');
await OS.wait(100);
OS.addBootLog('smss: Spawning lsass.obx (Security Authority)...');
OS.spawn('lsass.obx', 'Local Security Authority Process', '🔒', 'C:\\\\ObsidianOS\\\\System32\\\\lsass.obx');
await OS.wait(100);
OS.addBootLog('smss: All subsystems spawned. Session manager ready.');
OS.print('[smss] All subsystems spawned. Ready.');
// smss stays alive — it IS the session manager
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\csrss.obx',
    'csrss.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[csrss] Client Server Runtime Process starting...');
OS.registerCritical('WIN32K_SUBSYSTEM_FATAL', 'Client Server Runtime Process terminated. Win32 subsystem non-functional.', 'csrss.obx', '0x0000007E');
OS.declareDependency('smss.obx');
OS.addBootLog('csrss: Registered as critical, depends on smss.');
// csrss is the window/thread manager — it stays alive providing services
OS.print('[csrss] Win32 subsystem ready.');
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\wininit.obx',
    'wininit.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[wininit] Start-Up Application starting...');
OS.registerCritical('STARTUP_INIT_FAILED', 'Windows Start-Up Application failed during initialization.', 'wininit.obx', '0x0000005F');
OS.declareDependency('smss.obx');
OS.addBootLog('wininit: Registered as critical, depends on smss.');
OS.addBootLog('wininit: Spawning services.obx (Service Control Manager)...');
OS.spawn('services.obx', 'Services and Controller App', '⚙️', 'C:\\\\ObsidianOS\\\\System32\\\\services.obx');
await OS.wait(100);
OS.addBootLog('wininit: services.obx started.');
// wininit stays alive
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\services.obx',
    'services.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[services] Service Control Manager starting...');
OS.registerCritical('SERVICE_CONTROLLER_FAILED', 'Services and Controller App terminated. No services can run.', 'services.obx', '0x000000BE');
OS.declareDependency('wininit.obx');
OS.addBootLog('services: Registered as critical, depends on wininit.');
OS.addBootLog('services: Spawning svchost.obx (Service Host)...');
OS.spawn('svchost.obx', 'Service Host: Local System', '⚙️', 'C:\\\\ObsidianOS\\\\System32\\\\svchost.obx');
await OS.wait(100);
OS.addBootLog('services: svchost.obx started. Service Control Manager ready.');
// services stays alive — monitors service health
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\lsass.obx',
    'lsass.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[lsass] Local Security Authority Process starting...');
OS.registerCritical('SECURITY_PROCESS_FAILED', 'Local Security Authority Process failed. Authentication subsystem is down.', 'lsass.obx', '0x000000C0');
OS.declareDependency('smss.obx');
OS.addBootLog('lsass: Registered as critical, depends on smss.');

// Authentication service — registered FIRST so a later failure
// can never leave the system without a login path.
OS.ipcListen('auth:request', async (msg) => {
  const { requestId, username, password } = msg.data;
  const requester = msg.from;
  OS.print('[lsass] Auth request from PID ' + requester + ' for user: ' + username);

  const profiles = OS.getUserProfiles();
  const match = profiles.find(
    p => p.username.toLowerCase() === username.toLowerCase() && p.password === password
  );

  const success = !!match;
  OS.print('[lsass] Auth result for ' + username + ': ' + (success ? 'GRANTED' : 'DENIED'));

  OS.ipcSend(requester, 'auth:response:' + requestId, { success });
});

const myPid = OS.getPid();
OS.print('[lsass] Authentication service active on PID ' + myPid);
OS.addBootLog('lsass: Authentication subsystem ready on PID ' + myPid);

// Keep alive
while (true) { await OS.wait(3000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\svchost.obx',
    'svchost.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[svchost] Service Host: Local System starting...');
OS.registerCritical('SERVICE_HOST_DIED', 'Service Host process terminated unexpectedly.', 'svchost.obx', '0x000000D1');
OS.declareDependency('services.obx');
OS.addBootLog('svchost: Registered as critical, depends on services.');
OS.addBootLog('svchost: Hosting system services...');
// svchost stays alive — hosts generic services
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\dwm.obx',
    'dwm.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[dwm] Desktop Window Manager starting...');
OS.registerCritical('GRAPHICS_SUBSYSTEM_FAILED', 'Desktop Window Manager crashed. Display composition unavailable.', 'dwm.obx', '0x000000EA');
OS.declareDependency('csrss.obx');
OS.addBootLog('dwm: Registered as critical, depends on csrss.');
OS.addBootLog('dwm: Desktop composition ready.');
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\explorer.obx',
    'explorer.obx',
    'C:\\ObsidianOS\\System32',
    `
OS.print('[explorer] ObsidianOS Explorer starting...');
OS.registerCritical('SHELL_FAILED', 'Windows Shell (explorer) terminated. User interface is gone.', 'explorer.obx', '0x000000F4');
OS.declareDependency('dwm.obx');
OS.addBootLog('explorer: Registered as critical, depends on dwm.');
OS.addBootLog('explorer: Desktop shell ready.');
while (true) { await OS.wait(5000); }
    `.trim()
  ],
  [
    'C:\\ObsidianOS\\System32\\cmd.osl',
    'cmd.osl',
    'C:\\ObsidianOS\\System32',
    `
system::log("ObsidianOS Shell [Version 1.0.0]");
system::log("(c) Obsidian Corporation. All rights reserved.");

while (true) {
  let cwd = system::fs_getcwd();
  system::log("");
  system::log(cwd + "> ");

  let input = system::stdin();

  if (input == "help") {
    system::log("Comandos disponiveis:");
    system::log("  ls    - Listar arquivos");
    system::log("  cd    - Mudar diretorio");
    system::log("  echo  - Exibir texto");
    system::log("  mem   - Memoria PM do shell (mem::stats())");
    system::log("  pmsnap   - Salvar memoria em .pmem");
    system::log("  pmresume - Restaurar memoria do .pmem");
    system::log("  pmaudit  - Razao vs lastro da RAM");
    system::log("  help  - Mostrar esta ajuda");
    system::log("  exit  - Sair do shell");
  } else if (input == "ls") {
    let files = system::fs_list("");
    system::log(files);
  } else if (input == "mem") {
    system::log(system::mem_stats());
  } else if (input == "pmsnap") {
    system::log(system::mem_snap());
  } else if (input == "pmresume") {
    system::log(system::mem_resume());
  } else if (input == "pmaudit") {
    system::log(system::mem_audit());
  } else if (input == "exit") {
    return 0;
  } else if (input == "") {
  } else {
    system::log("Comando nao reconhecido: " + input);
  }
}
    `.trim()
  ],
];
