// ============================================
// Lock Screen / Login Screen — ObsidianOS Native Feel
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../stores/systemStore';
import { useUserStore } from '../../stores/userStore';
import kernel from '../../core/kernel';
import TerminalApp from '../../apps/Terminal/Terminal';
import defaultWallpaper from '../../assets/wallpapers/default.png';
import './LockScreen.css';

export default function LockScreen() {
  const { bootPhase, unlock, theme, isWifiConnected } = useSystem();
  const { currentUser, login } = useUserStore();
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Acessibilidade e ferramentas
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const accessibilityMenuRef = useRef<HTMLDivElement>(null);
  const powerMenuRef = useRef<HTMLDivElement>(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Foco no input ao abrir a tela de senha
  useEffect(() => {
    if (showPasswordField && !isTerminalOpen) {
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    }
  }, [showPasswordField, isTerminalOpen]);

  // Teclado global: Esc para voltar ao relógio, qualquer tecla para subir tela de senha
  useEffect(() => {
    if (bootPhase !== 'login') return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Se terminal estiver aberto, não intercepta atalhos do lockscreen
      if (isTerminalOpen) return;

      if (e.key === 'Escape') {
        if (showAccessibilityMenu) {
          setShowAccessibilityMenu(false);
          return;
        }
        if (showPowerMenu) {
          setShowPowerMenu(false);
          return;
        }
        if (showPasswordField) {
          setShowPasswordField(false);
          setPassword('');
          setError(false);
          return;
        }
      }

      // Se ainda estiver na tela do relógio, qualquer tecla (exceto teclas especiais) avança pro login
      if (!showPasswordField && !e.ctrlKey && !e.altKey && !e.metaKey && e.key !== 'Tab') {
        setShowPasswordField(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [bootPhase, showPasswordField, showAccessibilityMenu, showPowerMenu, isTerminalOpen]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        accessibilityMenuRef.current &&
        !accessibilityMenuRef.current.contains(target)
      ) {
        setShowAccessibilityMenu(false);
      }
      if (powerMenuRef.current && !powerMenuRef.current.contains(target)) {
        setShowPowerMenu(false);
      }
    };

    if (showAccessibilityMenu || showPowerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAccessibilityMenu, showPowerMenu]);

  if (bootPhase !== 'login') return null;

  // Wallpaper atual do sistema
  const currentWallpaper =
    theme.wallpaper && theme.wallpaper !== 'default'
      ? theme.wallpaper.startsWith('/') || theme.wallpaper.startsWith('http')
        ? theme.wallpaper
        : `/Wallpapers/${theme.wallpaper}`
      : defaultWallpaper;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleUnlock = async () => {
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setError(false);

    const currentUsername = currentUser?.username || 'Admin';
    // Autenticação via lsass (IPC)
    const authSuccess = await kernel.sysAuthenticateUser(currentUsername, password);

    if (authSuccess) {
      kernel.sysLogin(password);
      await login(currentUsername, password);
      setIsUnlocking(true);
      setTimeout(() => unlock(), 600);
    } else {
      setError(true);
      setPassword('');
      setIsAuthenticating(false);
      setTimeout(() => {
        setError(false);
        passwordInputRef.current?.focus();
      }, 1500);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  const handlePowerAction = (action: 'restart' | 'shutdown') => {
    if (action === 'restart') {
      window.location.reload();
    } else if (action === 'shutdown') {
      kernel.powerOff();
    }
  };

  return (
    <div
      className={`lock-screen ${isUnlocking ? 'unlocking' : ''} ${
        showPasswordField ? 'in-login-mode' : 'in-clock-mode'
      }`}
      style={{ backgroundImage: `url(${currentWallpaper})` }}
      onClick={() => {
        if (!showPasswordField && !isTerminalOpen) {
          setShowPasswordField(true);
        }
      }}
    >
      {/* Camada de acrílico com blur dinâmico */}
      <div className={`lock-acrylic-overlay ${showPasswordField ? 'blurred' : ''}`} />

      {/* Terminal flutuante (aberto via menu de acessibilidade) */}
      {isTerminalOpen && (
        <div
          className={`lock-terminal-modal ${isTerminalMaximized ? 'maximized' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="lock-terminal-header">
            <div className="lock-terminal-title">
              <span className="lock-terminal-icon">💻</span>
              <span>C:\ObsidianOS\System32\cmd.exe (Administrador)</span>
            </div>
            <div className="lock-terminal-controls">
              <button
                className="lock-terminal-btn"
                title="Minimizar"
                onClick={() => setIsTerminalOpen(false)}
              >
                _
              </button>
              <button
                className="lock-terminal-btn"
                title="Maximizar"
                onClick={() => setIsTerminalMaximized(!isTerminalMaximized)}
              >
                {isTerminalMaximized ? '❐' : '□'}
              </button>
              <button
                className="lock-terminal-btn close"
                title="Fechar"
                onClick={() => setIsTerminalOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="lock-terminal-body">
            <TerminalApp windowId="lockscreen-terminal" />
          </div>
        </div>
      )}

      {/* Tela do Relógio (desliza para cima quando entra na digitação) */}
      <div className={`lock-clock-section ${showPasswordField ? 'slid-up' : ''}`}>
        <div className="lock-time">{hours}:{minutes}</div>
        <div className="lock-date">{dateStr}</div>
        <div className="lock-swipe-hint">
          Pressione qualquer tecla ou clique para entrar
        </div>
      </div>

      {/* Painel de Login Centralizado */}
      <div
        className={`login-card ${showPasswordField ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de voltar para a tela do relógio */}
        <button
          className="login-back-btn"
          title="Voltar ao relógio (Esc)"
          onClick={() => {
            setShowPasswordField(false);
            setPassword('');
            setError(false);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="login-avatar-wrapper">
          <div className="login-avatar-ring">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="login-avatar-img"
              />
            ) : (
              <div className="login-avatar-fallback">
                <svg viewBox="0 0 24 24" fill="currentColor" width="46" height="46">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className="login-user-info">
          <div className="login-displayname">
            {currentUser?.displayName || 'Obsidian User'}
          </div>
          <div className="login-role-badge">
            {currentUser?.isAdmin ? 'Administrador' : 'Usuário Padrão'}
          </div>
        </div>

        {/* Input de Senha */}
        <div className={`login-box ${error ? 'shake-error' : ''}`}>
          <div className="login-input-container">
            <input
              ref={passwordInputRef}
              type={showPasswordText ? 'text' : 'password'}
              className="login-password-input"
              placeholder="Senha"
              value={password}
              disabled={isAuthenticating}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleInputKeyDown}
            />

            {/* Alternar visibilidade da senha */}
            {password.length > 0 && (
              <button
                type="button"
                className="login-eye-btn"
                title={showPasswordText ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setShowPasswordText(!showPasswordText)}
                tabIndex={-1}
              >
                {showPasswordText ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}

            {/* Botão de Enviar */}
            <button
              className="login-submit-btn"
              onClick={handleUnlock}
              disabled={isAuthenticating}
              title="Entrar"
            >
              {isAuthenticating ? (
                <div className="login-spinner" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mensagem de Erro ou Estado */}
        {error ? (
          <div className="login-error-msg">Senha incorreta. Tente novamente.</div>
        ) : isAuthenticating ? (
          <div className="login-status-msg">Bem-vindo...</div>
        ) : (
          <div className="login-subhint">Pressione Enter para entrar</div>
        )}
      </div>

      {/* Barra de Ações do Sistema (Canto Inferior Direito) */}
      <div
        className="lock-sys-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Indicador de Wi-Fi */}
        <div
          className="lock-sys-btn"
          title={isWifiConnected ? 'Internet Conectada' : 'Sem Conexão'}
        >
          {isWifiConnected ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19.08 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          )}
        </div>

        {/* Botão de Acessibilidade */}
        <div className="lock-menu-container" ref={accessibilityMenuRef}>
          <button
            className={`lock-sys-btn ${showAccessibilityMenu ? 'active' : ''}`}
            title="Acessibilidade e Ferramentas"
            onClick={() => {
              setShowAccessibilityMenu(!showAccessibilityMenu);
              setShowPowerMenu(false);
            }}
          >
            {/* Ícone clássico de acessibilidade */}
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z" />
            </svg>
          </button>

          {/* Menu Popover de Acessibilidade */}
          {showAccessibilityMenu && (
            <div className="lock-popover-menu">
              <div className="lock-popover-header">Acessibilidade & Ferramentas</div>

              <button
                className="lock-popover-item primary"
                onClick={() => {
                  setIsTerminalOpen(true);
                  setShowAccessibilityMenu(false);
                }}
              >
                <div className="lock-popover-icon">💻</div>
                <div className="lock-popover-info">
                  <div className="lock-popover-label">Prompt de Comando (Terminal)</div>
                  <div className="lock-popover-sub">
                    Executar comandos e recuperação do sistema
                  </div>
                </div>
              </button>

              <button
                className="lock-popover-item"
                onClick={() => {
                  alert(
                    'Para redefinir ou formatar o sistema de fábrica, abra o Terminal e execute o comando: user -reset --sys'
                  );
                  setShowAccessibilityMenu(false);
                }}
              >
                <div className="lock-popover-icon">ℹ️</div>
                <div className="lock-popover-info">
                  <div className="lock-popover-label">Ajuda de Recuperação</div>
                  <div className="lock-popover-sub">
                    Comando de formatação: user -reset --sys
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Botão de Energia */}
        <div className="lock-menu-container" ref={powerMenuRef}>
          <button
            className={`lock-sys-btn ${showPowerMenu ? 'active' : ''}`}
            title="Opções de Energia"
            onClick={() => {
              setShowPowerMenu(!showPowerMenu);
              setShowAccessibilityMenu(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
            </svg>
          </button>

          {/* Menu Popover de Energia */}
          {showPowerMenu && (
            <div className="lock-popover-menu power-menu">
              <button
                className="lock-popover-item"
                onClick={() => handlePowerAction('restart')}
              >
                <div className="lock-popover-icon">🔄</div>
                <div className="lock-popover-info">
                  <div className="lock-popover-label">Reiniciar</div>
                  <div className="lock-popover-sub">Reinicia o ObsidianOS</div>
                </div>
              </button>

              <button
                className="lock-popover-item danger"
                onClick={() => handlePowerAction('shutdown')}
              >
                <div className="lock-popover-icon">⏻</div>
                <div className="lock-popover-info">
                  <div className="lock-popover-label">Desligar</div>
                  <div className="lock-popover-sub">Encerra o sistema</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
