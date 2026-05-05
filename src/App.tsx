// ============================================
// ObsidianOS - Main Application
// ============================================
import { useEffect, useState } from 'react';
import { useSystem } from './stores/systemStore';
import BootScreen from './components/Boot/BootScreen';
import BSOD from './components/Boot/BSOD';
import RecoveryMode from './components/Boot/RecoveryMode';
import { useFileSystem } from './stores/fileSystem';
import { useProcessManager } from './stores/processManager';
import { useWindowManager } from './stores/windowManager';
import { useRegistry } from './stores/registry';
import kernel from './core/kernel';
import LockScreen from './components/LockScreen/LockScreen';
import SetupWizard from './components/Setup/SetupWizard';
import StartMenu from './components/StartMenu/StartMenu';
import WindowRenderer from './components/Window/WindowRenderer';
import { useContextMenuStore } from './stores/contextMenuStore';
import ContextMenu from './components/ContextMenu/ContextMenu';
import { NotificationContainer } from './components/Notifications/NotificationContainer';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { useUserStore } from './stores/userStore';
import './index.css';

export default function App() {
  const { bootPhase, theme } = useSystem();
  const [isBSOD, setIsBSOD] = useState(false);
  const [bsodInfo, setBsodInfo] = useState<any>(null);
  const [isRecovery] = useState(() => {
    const count = parseInt(localStorage.getItem('obsidianos_crash_count') ?? '0', 10);
    return count >= 3;
  });
  const getRegValue = useRegistry(s => s.getValue);
  const { currentUser } = useUserStore();

  // SYNC: Ensure Kernel user matches persisted Local User Store
  useEffect(() => {
    if (currentUser) {
      (kernel as any)._user = currentUser;
      (kernel as any)._emitSystemSnapshot();
    }
  }, [currentUser]);

  // Sync Hardware from Registry
  useEffect(() => {
    if (bootPhase === 'desktop') {
      // Successful boot — reset crash counter
      localStorage.removeItem('obsidianos_crash_count');
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
        const pid = createProcess('taskmgr.obx', 'Gerenciador de Tarefas', '📊');
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
  const explorerRunning = useProcessManager(s => s.processes.some(p => p.name === 'explorer.obx'));

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

  // DEEP REALISM: CPU/RAM monitorados via scheduler (kernel.startScheduler() called on finalizeBoot)
  // No manual interval needed here — the kernel scheduler emits cpuChange every 100ms
  const processes = useProcessManager(s => s.processes);

  // Start Shell Components as Windows (DEEP REALISM: Taskbar as a Window)
  useEffect(() => {
    if (bootPhase === 'desktop' && explorerRunning) {
      const proc = processes.find(p => p.name === 'explorer.obx');
      if (proc) {
        // Only open if not already opened (check registry or process windows)
        const hasTaskbar = kernel.getWindows().some(w => w.appId === 'taskbar');
        if (!hasTaskbar) {
          openWindow({
            appId: 'taskbar',
            title: 'Taskbar',
            icon: '',
            processId: proc.pid,
            width: window.innerWidth,
            height: 48,
            hasFrame: false,
            isSystem: true,
            params: { x: 0, y: window.innerHeight - 48 }
          });
        }

        const hasDesktop = kernel.getWindows().some(w => w.appId === 'desktop');
        if (!hasDesktop) {
          openWindow({
            appId: 'desktop',
            title: 'Desktop',
            icon: '',
            processId: proc.pid,
            width: window.innerWidth,
            height: window.innerHeight - 48,
            hasFrame: false,
            isSystem: true,
            zIndex: 1,
            params: { x: 0, y: 0 }
          });
        }
      }
    }
  }, [bootPhase, explorerRunning, processes, openWindow]);

  const { isOpen, x, y, items, closeContextMenu } = useContextMenuStore();

  return (
    <div className="obsidianos-root" data-theme={theme.mode}>
      {isRecovery ? (
        <RecoveryMode />
      ) : isBSOD && bsodInfo ? (
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
              <WindowRenderer />
              {explorerRunning && <StartMenu />}
            </>
          )}

          {/* OOBE / Initial Setup */}
          {bootPhase === 'setup' && <SetupWizard />}

          {/* System Dialogs & Overlays */}
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
