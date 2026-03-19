// ============================================
// Lock Screen / Login Screen
// ============================================
import { useState, useEffect } from 'react';
import { useSystem } from '../../stores/systemStore';
import './LockScreen.css';

export default function LockScreen() {
  const { bootPhase, currentUser, login } = useSystem();
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (bootPhase !== 'login') return null;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleUnlock = () => {
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }

    const success = login(password);
    if (success) {
      setIsUnlocking(true);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  return (
    <div
      className={`lock-screen ${isUnlocking ? 'unlocking' : ''}`}
      onClick={() => !showPasswordField && setShowPasswordField(true)}
    >
      {/* Time Display */}
      {!showPasswordField && (
        <div className="lock-time-container">
          <div className="lock-time">{hours}:{minutes}</div>
          <div className="lock-date">{dateStr}</div>
        </div>
      )}

      {/* Login Panel */}
      {showPasswordField && (
        <div className="login-panel">
          <div className="login-avatar">
            <div className="avatar-circle">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          
          <div className="login-username">{currentUser.displayName}</div>
          
          <div className={`login-input-wrapper ${error ? 'error' : ''}`}>
            <input
              type="password"
              className="login-input"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="login-submit" onClick={handleUnlock}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
          </div>
          
          {error && <div className="login-error">Senha incorreta</div>}
          
          <div className="login-hint">
            Pressione Enter para entrar
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {!showPasswordField && (
        <div className="lock-hint">
          Clique ou pressione qualquer tecla para entrar
        </div>
      )}
    </div>
  );
}
