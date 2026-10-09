// ============================================
// SystemState — user, session, theme, hardware
// ============================================
// Owns identity + personalization state. Previously scattered
// across Kernel privates (_user, _theme, _hardware, _isLocked,
// _userProfiles). validateCredentials lives here so login paths
// share one check instead of dead code in Kernel.

import type { SystemTheme, UserProfile } from '../../types';
import type { EventBus } from './event-bus';

export interface SystemSnapshot {
  user: UserProfile;
  isLocked: boolean;
  theme: SystemTheme;
  hardware: SystemState['hardwareSnapshot'];
}

export class SystemState {
  private user: UserProfile = {
    username: 'user', displayName: 'User', avatar: '', password: '',
    isAdmin: true, lastLogin: Date.now(),
  };
  private userProfiles: UserProfile[] = [];
  private isLocked = false;
  private theme: SystemTheme = {
    mode: 'dark', accentColor: '#6366f1', wallpaper: 'default',
    transparency: true, animationSpeed: 'normal', fontSize: 'medium',
  };
  private hardware = {
    volume: 75, isMuted: false, brightness: 100,
    isWifiConnected: true, isBluetooth: false, batteryLevel: 85,
  };
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.init();
  }

  get hardwareSnapshot() {
    return { ...this.hardware };
  }

  // ── Init / persistence ─────────────────────────────────────────────

  private init(): void {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('obsidianos-system-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.user = { ...this.user, ...parsed.user };
        this.theme = { ...this.theme, ...parsed.theme };
        this.hardware = { ...this.hardware, ...parsed.hardware };
        this.loadUserProfiles();
      } catch (e) {
        console.error('Failed to parse obsidianos-system-v2', e);
      }
    } else {
      const legacy = localStorage.getItem('webos-system-v2') || localStorage.getItem('webos-system');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          const state = parsed.state || parsed; // Handle different structures
          if (state) {
            this.user = { ...this.user, ...(state.user || state.currentUser) };
            this.theme = { ...this.theme, ...state.theme };
            this.hardware = {
              volume: state.volume ?? state.hardware?.volume ?? 75,
              isMuted: state.isMuted ?? state.hardware?.isMuted ?? false,
              brightness: state.brightness ?? state.hardware?.brightness ?? 100,
              isWifiConnected: state.isWifiConnected ?? state.hardware?.isWifiConnected ?? true,
              isBluetooth: state.isBluetooth ?? state.hardware?.isBluetooth ?? false,
              batteryLevel: state.batteryLevel ?? state.hardware?.batteryLevel ?? 85,
            };
          }
          this.persist();
        } catch (e) {
          console.error('Failed to parse legacy system state', e);
        }
      }
    }
  }

  /** Public so hosts (App, SetupWizard) can sync without (kernel as any) hacks. */
  persist(): void {
    if (typeof window === 'undefined') return;
    const state = { user: this.user, theme: this.theme, hardware: this.hardware };
    localStorage.setItem('obsidianos-system-v2', JSON.stringify(state));
    this.emitSnapshot();
  }

  emitSnapshot(): void {
    this.bus.emit('system:snapshot', this.getSnapshot());
  }

  getSnapshot(): SystemSnapshot {
    return {
      user: this.user,
      isLocked: this.isLocked,
      theme: this.theme,
      hardware: { ...this.hardware },
    };
  }

  /** Public setter replacing the (kernel as any)._user hack. */
  setCurrentUser(profile: UserProfile): void {
    this.user = profile;
    this.persist();
  }

  getCurrentUser(): UserProfile {
    return this.user;
  }

  getTheme(): SystemTheme {
    return this.theme;
  }

  // ── Profiles / auth ────────────────────────────────────────────────

  private loadUserProfiles(): void {
    try {
      const raw = localStorage.getItem('obsidianos_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state?.userProfiles) {
          this.userProfiles = parsed.state.userProfiles;
        }
      }
    } catch { /* ignore */ }
    // Ensure current user is in profiles
    if (!this.userProfiles.find((p) => p.username === this.user.username)) {
      this.userProfiles.unshift(this.user);
    }
  }

  getUserProfiles(): UserProfile[] {
    this.loadUserProfiles();
    return this.userProfiles;
  }

  updateUserProfile(profile: UserProfile): void {
    const idx = this.userProfiles.findIndex((p) => p.username === profile.username);
    if (idx >= 0) {
      this.userProfiles[idx] = profile;
    } else {
      this.userProfiles.push(profile);
    }
    // Sync back to userStore localStorage
    try {
      const raw = localStorage.getItem('obsidianos_user_session');
      const parsed = raw ? JSON.parse(raw) : { state: {} };
      parsed.state = { ...parsed.state, userProfiles: this.userProfiles };
      localStorage.setItem('obsidianos_user_session', JSON.stringify(parsed));
    } catch { /* ignore */ }
  }

  /**
   * Single credential check for every login path.
   * Empty password means "no password set" → direct access (legacy behavior).
   */
  validateCredentials(username: string, password: string): boolean {
    if (username.toLowerCase() === this.user.username.toLowerCase()) {
      if (this.user.password === '' || password === this.user.password) return true;
    }
    this.loadUserProfiles();
    return this.userProfiles.some(
      (p) => p.username.toLowerCase() === username.toLowerCase() && p.password === password,
    );
  }

  /** Returns true when the session may proceed to desktop. */
  login(password: string): boolean {
    if (this.validateCredentials(this.user.username, password)) {
      this.isLocked = false;
      this.user.lastLogin = Date.now();
      this.persist();
      this.bus.emit('system:bootPhase', 'desktop');
      return true;
    }
    return false;
  }

  lock(): void {
    this.isLocked = true;
    this.persist();
    this.bus.emit('system:bootPhase', 'login');
  }

  unlock(): void {
    this.isLocked = false;
    this.persist();
    this.bus.emit('system:bootPhase', 'desktop');
  }

  get locked(): boolean {
    return this.isLocked;
  }

  // ── Theme / hardware ───────────────────────────────────────────────

  setTheme(updates: Partial<SystemTheme>): void {
    this.theme = { ...this.theme, ...updates };
    this.persist();
  }

  setVolume(volume: number): void {
    this.hardware.volume = Math.max(0, Math.min(100, volume));
    this.persist();
  }

  toggleMute(): void {
    this.hardware.isMuted = !this.hardware.isMuted;
    this.persist();
  }

  setBrightness(brightness: number): void {
    this.hardware.brightness = Math.max(0, Math.min(100, brightness));
    this.persist();
  }

  toggleWifi(): void {
    this.hardware.isWifiConnected = !this.hardware.isWifiConnected;
    this.persist();
  }

  toggleBluetooth(): void {
    this.hardware.isBluetooth = !this.hardware.isBluetooth;
    this.persist();
  }

  reset(): void {
    this.isLocked = false;
    this.init();
  }
}
