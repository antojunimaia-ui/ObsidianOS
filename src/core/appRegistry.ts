// ============================================
// App Registry - Dynamic System Discovery
// ============================================
import { lazy } from 'react';
import { create } from 'zustand';
import type { AppDefinition } from '../types';

// Static definitions of the *Components* (The "Binaries" on disk)
// We still need these imports for the bundle, but they will be mapped dynamically
const components: Record<string, ReturnType<typeof lazy>> = {
  'terminal': lazy(() => import('../apps/Terminal/Terminal')),
  'notepad': lazy(() => import('../apps/Notepad/Notepad')),
  'calculator': lazy(() => import('../apps/Calculator/Calculator')),
  'file-explorer': lazy(() => import('../apps/FileExplorer/FileExplorer')),
  'settings': lazy(() => import('../apps/Settings/Settings')),
  'task-manager': lazy(() => import('../apps/TaskManager/TaskManager')),
  'browser': lazy(() => import('../apps/Browser/Browser')),
  'regedit': lazy(() => import('../apps/Regedit/Regedit')),
};

// Fallback for SDK / unknown apps — loaded lazily to avoid circular deps
const SdkAppRunner = lazy(() => import('../apps/SdkAppRunner/SdkAppRunner'));

interface AppRegistryState {
  apps: Record<string, AppDefinition>;
  isReady: boolean;
  registerApp: (app: AppDefinition) => void;
  getApp: (id: string) => AppDefinition | undefined;
  setReady: (ready: boolean) => void;
}

export const useAppRegistry = create<AppRegistryState>((set, get) => ({
  apps: {},
  isReady: false,
  registerApp: (app) => set((state) => ({ 
    apps: { ...state.apps, [app.id]: app } 
  })),
  getApp: (id) => get().apps[id],
  setReady: (ready) => set({ isReady: ready }),
}));

// Helper to get component by ID — falls back to SdkAppRunner for unknown/SDK apps
export const getAppComponent = (id: string) => components[id] ?? SdkAppRunner;

// Backward compatibility or for things that need a list
export const getAppList = () => Object.values(useAppRegistry.getState().apps);

// Initial empty registry (will be populated by Kernel)
export const appRegistry: Record<string, AppDefinition> = {};
export const appList: any[] = [];


