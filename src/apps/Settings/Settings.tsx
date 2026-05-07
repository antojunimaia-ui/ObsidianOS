// ============================================
// Settings App
// ============================================
import { useState } from 'react';
import { useSystem } from '../../stores/systemStore';
import { useRegistry } from '../../stores/registry';
import './Settings.css';

const sections = [
  { id: 'system', label: 'Sistema', icon: '💻' },
  { id: 'display', label: 'Tela', icon: '🖥️' },
  { id: 'personalization', label: 'Personalização', icon: '🎨' },
  { id: 'network', label: 'Rede e Internet', icon: '🌐' },
  { id: 'apps', label: 'Aplicativos', icon: '📦' },
  { id: 'accounts', label: 'Contas', icon: '👤' },
  { id: 'privacy', label: 'Privacidade', icon: '🔒' },
  { id: 'update', label: 'Atualização', icon: '🔄' },
  { id: 'about', label: 'Sobre', icon: 'ℹ️' },
];

export default function SettingsApp({ }: { windowId: string }) {
  const [activeSection, setActiveSection] = useState('personalization');
  const { theme, setTheme, currentUser, volume, setVolume, brightness, setBrightness } = useSystem();
  const { getValue } = useRegistry();

  const accentColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b',
  ];

  const taskbarPosition = String(useRegistry(s => s.hives['HKEY_CURRENT_USER\\Software\\ObsidianOS\\Taskbar']?.Position?.value || 'bottom'));
  const taskbarAlignment = String(useRegistry(s => s.hives['HKEY_CURRENT_USER\\Software\\ObsidianOS\\Taskbar']?.Alignment?.value || 'center'));

  const renderContent = () => {
    switch (activeSection) {
      case 'personalization':
        return (
          <div className="settings-content-inner">
            <h2>Personalização</h2>

            <div className="settings-card">
              <h3>Tema</h3>
              <div className="settings-theme-selector">
                <button
                  className={`theme-option ${theme.mode === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme({ mode: 'dark' })}
                >
                  <div className="theme-preview dark-preview" />
                  <span>Escuro</span>
                </button>
                <button
                  className={`theme-option ${theme.mode === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme({ mode: 'light' })}
                >
                  <div className="theme-preview light-preview" />
                  <span>Claro</span>
                </button>
              </div>
            </div>

            <div className="settings-card">
              <h3>Cor de destaque</h3>
              <div className="settings-accent-grid">
                {accentColors.map(color => (
                  <button
                    key={color}
                    className={`accent-option ${theme.accentColor === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => {
                      setTheme({ accentColor: color });
                      document.documentElement.style.setProperty('--accent', color);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="settings-card">
              <h3>Plano de Fundo</h3>
              <div className="settings-wallpaper-grid">
                <button
                  className={`wallpaper-option ${(!theme.wallpaper || theme.wallpaper === 'default') ? 'active' : ''}`}
                  onClick={() => setTheme({ wallpaper: 'default' })}
                >
                  <div className="wallpaper-thumb" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }} />
                  <span className="wallpaper-label">Padrão</span>
                </button>
                <button
                  className={`wallpaper-option ${theme.wallpaper === 'abstract.png' ? 'active' : ''}`}
                  onClick={() => setTheme({ wallpaper: 'abstract.png' })}
                >
                  <div className="wallpaper-thumb" style={{ backgroundImage: 'url(/Wallpapers/abstract.png)' }} />
                  <span className="wallpaper-label">Abstrato</span>
                </button>
                <button
                  className={`wallpaper-option ${theme.wallpaper === 'nature.png' ? 'active' : ''}`}
                  onClick={() => setTheme({ wallpaper: 'nature.png' })}
                >
                  <div className="wallpaper-thumb" style={{ backgroundImage: 'url(/Wallpapers/nature.png)' }} />
                  <span className="wallpaper-label">Natureza</span>
                </button>
                <button
                  className={`wallpaper-option ${theme.wallpaper === 'city.png' ? 'active' : ''}`}
                  onClick={() => setTheme({ wallpaper: 'city.png' })}
                >
                  <div className="wallpaper-thumb" style={{ backgroundImage: 'url(/Wallpapers/city.png)' }} />
                  <span className="wallpaper-label">Cidade</span>
                </button>
              </div>
            </div>

            <div className="settings-card">
              <h3>Efeitos de transparência</h3>
              <div className="settings-toggle-row">
                <div>
                  <span className="settings-label">Transparência</span>
                  <span className="settings-desc">Efeitos de transparência e acrílico</span>
                </div>
                <button
                  className={`settings-toggle ${theme.transparency ? 'on' : ''}`}
                  onClick={() => setTheme({ transparency: !theme.transparency })}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>

            <div className="settings-card">
              <h3>Barra de Tarefas</h3>
              
              <div className="settings-toggle-row">
                <div>
                  <span className="settings-label">Posição da Barra</span>
                  <span className="settings-desc">Onde a barra de tarefas aparece na tela</span>
                </div>
                <select 
                  className="settings-select"
                  value={taskbarPosition}
                  onChange={(e) => {
                    const { setValue } = useRegistry.getState();
                    setValue('HKEY_CURRENT_USER\\Software\\ObsidianOS\\Taskbar\\Position', 'REG_SZ', e.target.value);
                  }}
                >
                  <option value="bottom">Abaixo</option>
                  <option value="top">Acima</option>
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                </select>
              </div>

              <div className="settings-toggle-row" style={{ marginTop: '16px' }}>
                <div>
                  <span className="settings-label">Alinhamento dos Ícones</span>
                  <span className="settings-desc">Posição dos ícones dos aplicativos</span>
                </div>
                <select 
                  className="settings-select"
                  value={taskbarAlignment}
                  onChange={(e) => {
                    const { setValue } = useRegistry.getState();
                    setValue('HKEY_CURRENT_USER\\Software\\ObsidianOS\\Taskbar\\Alignment', 'REG_SZ', e.target.value);
                  }}
                >
                  <option value="center">Centralizado</option>
                  <option value="left">À esquerda</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="settings-content-inner">
            <h2>Sistema</h2>
            <div className="settings-card">
              <h3>Som</h3>
              <div className="settings-slider-row">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="settings-slider"
                />
                <span>{volume}%</span>
              </div>
            </div>
            <div className="settings-card">
              <h3>Tela</h3>
              <div className="settings-slider-row">
                <span>Brilho</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="settings-slider"
                />
                <span>{brightness}%</span>
              </div>
            </div>
            <div className="settings-card">
              <h3>Recuperação do Sistema</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 'bold' }}>Restaurar o PC</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Atenção: A formatação apaga todo seu Disco Local virtual (OPFS) de forma irrecuperável.</span>
                </div>
                <button
                  style={{ background: '#b91c1c', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => {
                    if (window.confirm('ATENÇÃO: TEM CERTEZA ABSOLUTA? Isso irá limpar seu disco virtual (OPFS) e dados da página, reinstalando o sistema operacional ObsidianOS do zero.')) {
                      navigator.storage.getDirectory().then(async d => {
                        for await (const [n] of (d as any).entries()) {
                          await d.removeEntry(n, { recursive: true });
                        }
                      }).catch(e => console.error(e)).finally(() => {
                        localStorage.clear();
                        window.location.reload();
                      });
                    }
                  }}
                >
                  Formatar Sistema
                </button>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-content-inner">
            <h2>Sobre</h2>
            <div className="settings-card about-card">
              <div className="about-logo">
                <svg width="64" height="64" viewBox="0 0 88 88" fill="none">
                  <rect x="2" y="2" width="38" height="38" rx="4" fill="var(--accent)" opacity="0.9" />
                  <rect x="48" y="2" width="38" height="38" rx="4" fill="var(--accent)" opacity="0.7" />
                  <rect x="2" y="48" width="38" height="38" rx="4" fill="var(--accent)" opacity="0.7" />
                  <rect x="48" y="48" width="38" height="38" rx="4" fill="var(--accent)" opacity="0.5" />
                </svg>
              </div>
              <div className="about-info">
                <div className="about-row"><span>Nome do Dispositivo</span><span>DESKTOP-OBSIDIAN</span></div>
                <div className="about-row"><span>Processador</span><span>ObsidianOS Virtual CPU @ {navigator.hardwareConcurrency || 8} cores</span></div>
                <div className="about-row"><span>RAM</span><span>{(navigator as any).deviceMemory || 8} GB</span></div>
                <div className="about-row"><span>Sistema</span><span>ObsidianOS Professional</span></div>
                <div className="about-row"><span>Edição</span><span>{String(getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\EditionID') || 'Professional')}</span></div>
                <div className="about-row"><span>Versão</span><span>{String(getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\DisplayVersion') || '24H2')}</span></div>
                <div className="about-row"><span>Build do SO</span><span>{String(getValue('HKEY_LOCAL_MACHINE\\SOFTWARE\\ObsidianOS\\CurrentVersion\\CurrentBuild') || '26100')}</span></div>
                <div className="about-row"><span>Proprietário</span><span>{currentUser.displayName}</span></div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="settings-content-inner">
            <h2>{sections.find(s => s.id === activeSection)?.label}</h2>
            <div className="settings-card">
              <p style={{ color: 'var(--text-tertiary)' }}>Esta seção está em desenvolvimento.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="settings-app">
      <div className="settings-sidebar">
        <div className="settings-sidebar-header">
          <div className="settings-user-info">
            <div className="settings-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span>{currentUser.displayName}</span>
          </div>
        </div>

        <nav className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-content">
        {renderContent()}
      </div>
    </div>
  );
}
