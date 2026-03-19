// ============================================
// Desktop Component
// ============================================
import { useState, useCallback } from 'react';
import { useSystem } from '../../stores/systemStore';
import { useWindowManager } from '../../stores/windowManager';
import { useProcessManager } from '../../stores/processManager';
import { useContextMenuStore } from '../../stores/contextMenuStore';
import { useAppRegistry } from '../../core/appRegistry';
import defaultWallpaper from '../../assets/wallpapers/default.png';
import './Desktop.css';

interface DesktopIconData {
  id: string;
  name: string;
  icon: string;
  appId: string;
}

const defaultIcons: DesktopIconData[] = [
  { id: 'recycle', name: 'Lixeira', icon: '🗑️', appId: '' },
  { id: 'explorer', name: 'Explorador de Arquivos', icon: '📁', appId: 'file-explorer' },
  { id: 'terminal', name: 'Terminal', icon: '💻', appId: 'terminal' },
  { id: 'notepad', name: 'Bloco de Notas', icon: '📝', appId: 'notepad' },
  { id: 'browser', name: 'Navegador', icon: '🌐', appId: 'browser' },
  { id: 'settings', name: 'Configurações', icon: '⚙️', appId: 'settings' },
];

export default function Desktop() {
  const { bootPhase, closeStartMenu, theme } = useSystem();
  const openWindow = useWindowManager(s => s.openWindow);
  const createProcess = useProcessManager(s => s.createProcess);
  const { openContextMenu } = useContextMenuStore();
  const apps = useAppRegistry((s: any) => s.apps);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleOpenApp = useCallback((appId: string) => {
    if (!appId) return;
    const app = apps[appId];
    if (!app) return;

    const pid = createProcess(app.id, app.name, app.icon);
    openWindow({
      title: app.name,
      icon: app.icon,
      appId: app.id,
      width: app.defaultWidth,
      height: app.defaultHeight,
      minWidth: app.minWidth,
      minHeight: app.minHeight,
      isResizable: app.isResizable,
      processId: pid,
    });
  }, [openWindow, createProcess, apps]);

  const handleDoubleClick = useCallback((appId: string) => {
    handleOpenApp(appId);
  }, [handleOpenApp]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    closeStartMenu();
    openContextMenu(e.clientX, e.clientY, [
      { id: 'view', label: 'Exibir', children: [
        { id: 'large', label: 'Ícones grandes', onClick: () => {} },
        { id: 'medium', label: 'Ícones médios', onClick: () => {} },
        { id: 'small', label: 'Ícones pequenos', onClick: () => {} },
      ]},
      { id: 'sort', label: 'Classificar por', children: [
        { id: 'name', label: 'Nome', onClick: () => {} },
        { id: 'size', label: 'Tamanho', onClick: () => {} },
        { id: 'date', label: 'Data', onClick: () => {} },
      ]},
      { id: 'sep1', label: '', separator: true },
      { id: 'refresh', label: 'Atualizar', shortcut: 'F5', onClick: () => window.location.reload() },
      { id: 'sep2', label: '', separator: true },
      { id: 'new', label: 'Novo', children: [
        { id: 'folder', label: '📁 Pasta', onClick: () => {} },
        { id: 'txt', label: '📝 Documento de Texto', onClick: () => {} },
        { id: 'shortcut', label: '🔗 Atalho', onClick: () => {} },
      ]},
      { id: 'sep3', label: '', separator: true },
      { id: 'display', label: 'Configurações de Exibição', onClick: () => handleOpenApp('settings') },
      { id: 'personalize', label: 'Personalizar', onClick: () => handleOpenApp('settings') },
    ]);
  }, [closeStartMenu, openContextMenu, handleOpenApp]);

  const handleDesktopClick = useCallback(() => {
    setSelectedIcon(null);
    closeStartMenu();
  }, [closeStartMenu]);

  if (bootPhase !== 'desktop') return null;

  const currentWallpaper = (theme.wallpaper && theme.wallpaper !== 'default') 
    ? (theme.wallpaper.startsWith('/') || theme.wallpaper.startsWith('http') ? theme.wallpaper : `/Wallpapers/${theme.wallpaper}`) 
    : defaultWallpaper;

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${currentWallpaper})` }}
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      <div className="desktop-icons">
        {defaultIcons.map((icon, index) => (
          <div
            key={icon.id}
            className={`desktop-icon ${selectedIcon === icon.id ? 'selected' : ''}`}
            style={{ '--icon-index': index } as React.CSSProperties}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIcon(icon.id);
              closeStartMenu();
            }}
            onDoubleClick={() => handleDoubleClick(icon.appId)}
          >
            <div className="desktop-icon-image">{icon.icon}</div>
            <span className="desktop-icon-label">{icon.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
