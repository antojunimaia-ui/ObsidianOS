// ============================================
// Start Menu Component
// ============================================
import { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../stores/systemStore';
import { useWindowManager } from '../../stores/windowManager';
import { useProcessManager } from '../../stores/processManager';
import { useContextMenuStore } from '../../stores/contextMenuStore';
import { useAppRegistry } from '../../core/appRegistry';
import './StartMenu.css';

export default function StartMenu() {
  const { isStartMenuOpen, closeStartMenu, currentUser } = useSystem();
  const openWindow = useWindowManager(s => s.openWindow);
  const createProcess = useProcessManager(s => s.createProcess);
  const { openContextMenu } = useContextMenuStore();
  const apps = useAppRegistry((s: any) => s.apps);
  const appList = Object.values(apps);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isStartMenuOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isStartMenuOpen) setSearchQuery('');
  }, [isStartMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const taskbar = document.querySelector('.taskbar');
        if (taskbar && !taskbar.contains(e.target as Node)) {
          closeStartMenu();
        }
      }
    };
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStartMenu();
    };

    if (isStartMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isStartMenuOpen, closeStartMenu]);

  const handleOpenApp = (appId: string) => {
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
    closeStartMenu();
  };

  const filteredApps = searchQuery
    ? appList.filter((app: any) => app.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : appList;

  const pinnedApps = appList.slice(0, 6);

  const handleAppContextMenu = (e: React.MouseEvent, app: any) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, [
      { id: 'open', label: 'Abrir', icon: '⚡', onClick: () => handleOpenApp(app.id) },
      { id: 'admin', label: 'Executar como administrador', icon: '🛡️', onClick: () => handleOpenApp(app.id) },
      { id: 'sep1', label: '', separator: true },
      { id: 'unpin', label: 'Desafixar de Iniciar', icon: '📌', onClick: () => {} },
      { id: 'taskbar', label: 'Fixar na barra de tarefas', icon: '🔗', onClick: () => {} },
      { id: 'sep2', label: '', separator: true },
      { id: 'uninstall', label: 'Desinstalar', icon: '🗑️', disabled: true, onClick: () => {} },
    ]);
  };

  if (!isStartMenuOpen) return null;

  return (
    <div className="start-menu-overlay">
      <div ref={menuRef} className="start-menu acrylic">
        {/* Search Bar */}
        <div className="start-search">
          <svg className="start-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="start-search-input"
            placeholder="Pesquisar apps, configurações, documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        {!searchQuery ? (
          <>
            {/* Pinned Section */}
            <div className="start-section">
              <div className="start-section-header">
                <span className="start-section-title">Fixados</span>
                <button className="start-section-btn">Todos os apps →</button>
              </div>
              <div className="start-pinned-grid">
                {pinnedApps.map((app: any) => (
                  <button
                    key={app.id}
                    className="start-app-btn"
                    onClick={() => handleOpenApp(app.id)}
                    onContextMenu={(e) => handleAppContextMenu(e, app)}
                  >
                    <span className="start-app-icon">{app.icon}</span>
                    <span className="start-app-name">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Section */}
            <div className="start-section">
              <div className="start-section-header">
                <span className="start-section-title">Recomendados</span>
                <button className="start-section-btn">Mais →</button>
              </div>
              <div className="start-recommended">
                <div className="start-recommended-item">
                  <span className="recommended-icon">📝</span>
                  <div className="recommended-info">
                    <span className="recommended-name">readme.txt</span>
                    <span className="recommended-meta">Recentemente modificado</span>
                  </div>
                </div>
                <div className="start-recommended-item">
                  <span className="recommended-icon">📄</span>
                  <div className="recommended-info">
                    <span className="recommended-name">project.js</span>
                    <span className="recommended-meta">Ontem</span>
                  </div>
                </div>
                <div className="start-recommended-item">
                  <span className="recommended-icon">🌐</span>
                  <div className="recommended-info">
                    <span className="recommended-name">report.html</span>
                    <span className="recommended-meta">Esta semana</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Search Results */
          <div className="start-section">
            <div className="start-section-header">
              <span className="start-section-title">Resultados</span>
            </div>
            <div className="start-search-results">
              {filteredApps.map((app: any) => (
                <button
                  key={app.id}
                  className="start-search-result"
                  onClick={() => handleOpenApp(app.id)}
                  onContextMenu={(e) => handleAppContextMenu(e, app)}
                >
                  <span className="start-app-icon">{app.icon}</span>
                  <div className="search-result-info">
                    <span className="search-result-name">{app.name}</span>
                    <span className="search-result-type">Aplicativo</span>
                  </div>
                </button>
              ))}
              {filteredApps.length === 0 && (
                <div className="start-no-results">
                  Nenhum resultado encontrado para "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom User Section */}
        <div className="start-bottom">
          <button className="start-user-btn">
            <div className="start-user-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="start-user-name">{currentUser.displayName}</span>
          </button>
          <button 
            className="start-power-btn" 
            onClick={() => {
              closeStartMenu();
              window.location.reload();
            }} 
            title="Reiniciar o Sistema"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
              <line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
