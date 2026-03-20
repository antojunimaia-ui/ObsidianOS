// ============================================
// ObsidianOS - Main Application
// ============================================
import { useEffect, useState } from 'react';
import { useSystem } from './stores/systemStore';
import BootScreen from './components/Boot/BootScreen';
import BSOD from './components/Boot/BSOD';
import { useFileSystem } from './stores/fileSystem';
import { useProcessManager } from './stores/processManager';
import { useWindowManager } from './stores/windowManager';
import { useRegistry } from './stores/registry';
import kernel from './core/kernel';
import LockScreen from './components/LockScreen/LockScreen';
import Desktop from './components/Desktop/Desktop';
import Taskbar from './components/Taskbar/Taskbar';
import StartMenu from './components/StartMenu/StartMenu';
import WindowRenderer from './components/Window/WindowRenderer';
import { useContextMenuStore } from './stores/contextMenuStore';
import ContextMenu from './components/ContextMenu/ContextMenu';
import { NotificationContainer } from './components/Notifications/NotificationContainer';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import './index.css';

export default function App() {
  const { bootPhase, theme } = useSystem();
  const [isBSOD, setIsBSOD] = useState(false);
  const [bsodInfo, setBsodInfo] = useState<any>(null);
  const getRegValue = useRegistry(s => s.getValue);

  // Sync Hardware from Registry
  useEffect(() => {
    if (bootPhase === 'desktop') {
      const ram = getRegValue('HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PhysicalMemoryMB');
      if (typeof ram === 'number') {
        (kernel as any)._resources.totalMemory = ram;
      }
    }
  }, [bootPhase, getRegValue]);

  // Apply theme-based CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accentColor);

    // Set document title
    document.title = 'ObsidianOS';
  }, [theme]);

  // Handle global BSOD listening
  useEffect(() => {
    const unsub = kernel.on('bootPhaseChange', (phase) => {
      if (phase === 'BSOD') {
        setBsodInfo(kernel.bsodInfo);
        setIsBSOD(true);
      } else if (phase === 'OFF') {
        setIsBSOD(false);
      }
    });
    
    if (kernel.bootPhase === 'BSOD') {
      setBsodInfo(kernel.bsodInfo);
      setIsBSOD(true);
    }
    
    return unsub;
  }, []);

  const openWindow = useWindowManager(s => s.openWindow);
  const createProcess = useProcessManager(s => s.createProcess);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+Escape = Task Manager
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        const pid = createProcess('taskmgr.exe', 'Gerenciador de Tarefas', '📊');
        openWindow({
          appId: 'task-manager',
          title: 'Gerenciador de Tarefas',
          icon: '📊',
          width: 800,
          height: 550,
          processId: pid,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openWindow, createProcess]);

  // DEEP REALISM: Watch critical system files & processes
  const gdi32 = useFileSystem(s => !!s.nodes['C:\\ObsidianOS\\System32\\gdi32.dll']);
  const user32 = useFileSystem(s => !!s.nodes['C:\\ObsidianOS\\System32\\user32.dll']);
  const explorerRunning = useProcessManager(s => s.processes.some(p => p.name === 'explorer.exe'));

  // GDI32 Failure Corrupts the screen visually
  useEffect(() => {
    if (!gdi32 && bootPhase !== 'off') {
      document.body.classList.add('gdi-failure');
      const timer = setTimeout(() => {
        kernel.triggerBSOD({
          stopCode: 'WIN32K_CRITICAL_FAILURE',
          technicalInfo: 'GDI Subsystem completely failed. Missing component: gdi32.dll.',
          failedComponent: 'gdi32.dll',
          bugCheckCode: '0x0000003B',
          parameters: ['0xC0000006', '0x00000000', '0x00000000', '0x00000000']
        });
        document.body.classList.remove('gdi-failure');
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      document.body.classList.remove('gdi-failure');
    }
  }, [gdi32, bootPhase]);

  // USER32 Failure makes system unresponsive
  useEffect(() => {
    if (!user32 && bootPhase !== 'off') {
      document.body.style.pointerEvents = 'none';
      const timer = setTimeout(() => {
        kernel.triggerBSOD({
          stopCode: 'CLIENT_SERVER_RUNTIME_ISSUE',
          technicalInfo: 'USER32 subsystem terminated unexpectedly.',
          failedComponent: 'user32.dll',
          bugCheckCode: '0x000000F4',
          parameters: ['0x00000003', '0x00000000', '0x00000000', '0x00000000']
        });
        document.body.style.pointerEvents = '';
      }, 5000);
      return () => { clearTimeout(timer); document.body.style.pointerEvents = ''; };
    }
  }, [user32, bootPhase]);

  // DEEP REALISM: Watch Critical Processes
  const csrss = useProcessManager(s => s.processes.some(p => p.name === 'csrss.exe'));
  const wininit = useProcessManager(s => s.processes.some(p => p.name === 'wininit.exe'));
  const lsass = useProcessManager(s => s.processes.some(p => p.name === 'lsass.exe'));
  const smss = useProcessManager(s => s.processes.some(p => p.name === 'smss.exe'));
  const servicesProc = useProcessManager(s => s.processes.some(p => p.name === 'services.exe'));
  const dwm = useProcessManager(s => s.processes.some(p => p.name === 'dwm.exe'));
  const systemProc = useProcessManager(s => s.processes.some(p => p.name === 'System'));

  useEffect(() => {
    if (bootPhase !== 'desktop' || isBSOD) return;

    let failed = '';
    let stopCode = 'CRITICAL_PROCESS_DIED';
    let technical = 'A critical system process terminated.';

    if (!systemProc) { failed = 'ntoskrnl.exe'; technical = 'The System kernel process was terminated.'; }
    else if (!smss) { failed = 'smss.exe'; technical = 'Session Manager Subsystem process died.'; }
    else if (!csrss) { failed = 'csrss.exe'; technical = 'Client Server Runtime Process died.'; }
    else if (!wininit) { failed = 'wininit.exe'; technical = 'Windows Start-Up Application stopped.'; }
    else if (!lsass) { failed = 'lsass.exe'; technical = 'Local Security Authority Process encountered a critical error.'; }
    else if (!servicesProc) { failed = 'services.exe'; technical = 'Services and Controller App stopped.'; }
    else if (!dwm) { 
      failed = 'dwm.exe'; 
      stopCode = 'DESKTOP_WINDOW_MANAGER_DIED';
      technical = 'Desktop Window Manager (DWM) encountered a fatal error and could not be restarted.';
    }

    if (failed) {
      kernel.triggerBSOD({
         stopCode,
         technicalInfo: technical,
         failedComponent: failed,
         bugCheckCode: '0x000000EF',
         parameters: ['0x00000000', '0x00000000', '0x00000000', '0x00000000']
      });
    }
  }, [csrss, wininit, lsass, smss, servicesProc, dwm, systemProc, bootPhase, isBSOD]);

  // DEEP REALISM: CPU/RAM monitorados via processos
  const processes = useProcessManager(s => s.processes);

  // RESOURCE MONITORING LOOP — CPU calculado a partir dos processos
  // RAM não precisa mais ser sincronizada: o kernel gerencia via allocateMemory/freeMemory
  useEffect(() => {
    if (bootPhase !== 'desktop' || isBSOD) return;

    const interval = setInterval(() => {
      const totalCpu = processes.reduce((sum, p) => sum + p.cpuUsage, 0);
      const organicCpu = Math.min(100, totalCpu + (Math.random() * 2));
      kernel.updateCpuUsage(organicCpu);
    }, 2000);

    return () => clearInterval(interval);
  }, [processes, bootPhase, isBSOD]);

  // O kernel garante que ao terminar um processo, a janela já é fechada via kernel.closeWindow()
  // e ao fechar uma janela, o processo é encerrado via kernel.terminateProcess().
  // Não é mais necessário um sync loop externo.

  const { isOpen, x, y, items, closeContextMenu } = useContextMenuStore();

  return (
    <div className="obsidianos-root" data-theme={theme.mode}>
      {isBSOD && bsodInfo ? (
        <BSOD info={bsodInfo} />
      ) : (
        <>
          {/* Boot Screen */}
          {(bootPhase === 'off' || bootPhase === 'bios' || bootPhase === 'loading') && (
            <BootScreen />
          )}

          {/* Lock Screen */}
          {bootPhase === 'login' && (
            <LockScreen />
          )}

          {/* Desktop Environment */}
          {bootPhase === 'desktop' && (
            <>
              {explorerRunning && <Desktop />}
              <WindowRenderer />
              {explorerRunning && <StartMenu />}
              {explorerRunning && <Taskbar />}
            </>
          )}

          {/* Global Notifications */}
          <NotificationContainer />
          <NotificationCenter />

          {/* Global Context Menu */}
          {isOpen && (
            <ContextMenu
              x={x}
              y={y}
              items={items}
              onClose={closeContextMenu}
            />
          )}
        </>
      )}
    </div>
  );
}
