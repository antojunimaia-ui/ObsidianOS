import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '../types';
import cloudSync from '../utils/cloudSync';

interface UserState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  userProfiles: UserProfile[];
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createProfile: (profile: Omit<UserProfile, 'lastLogin'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// Default system user
const DEFAULT_USER: UserProfile = {
  username: 'Admin',
  displayName: 'Administrator',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  password: '123', // In a real app, this would be hashed on the server
  isAdmin: true,
  lastLogin: Date.now()
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      userProfiles: [DEFAULT_USER],

      login: async (username, password) => {
        // TENTA LOGIN NA NUVEM PRIMEIRO (LiveMode Real)
        const cloudProfile = await cloudSync.loginCloud(username, password);
        
        if (cloudProfile) {
          const updatedProfile = { ...cloudProfile, lastLogin: Date.now() };
          set({ 
            currentUser: updatedProfile, 
            isAuthenticated: true,
            userProfiles: get().userProfiles.find(p => p.username === username) 
              ? get().userProfiles.map(p => p.username === username ? updatedProfile : p)
              : [...get().userProfiles, updatedProfile]
          });
          return true;
        }

        // FALLBACK PARA LOGIN LOCAL (Se falhar a nuvem ou offline)
        const profile = get().userProfiles.find(
          p => p.username.toLowerCase() === username.toLowerCase() && p.password === password
        );

        if (profile) {
          const updatedProfile = { ...profile, lastLogin: Date.now() };
          set({ 
            currentUser: updatedProfile, 
            isAuthenticated: true,
            userProfiles: get().userProfiles.map(p => p.username === username ? updatedProfile : p)
          });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      createProfile: (profile) => set(state => ({
        userProfiles: [...state.userProfiles, { ...profile, lastLogin: Date.now() }]
      })),

      updateProfile: (updates) => set(state => {
        if (!state.currentUser) return state;
        const updated = { ...state.currentUser, ...updates };
        return {
          currentUser: updated,
          userProfiles: state.userProfiles.map(p => p.username === updated.username ? updated : p)
        };
      })
    }),
    {
      name: 'obsidianos_user_session',
      partialize: (state) => ({ 
        userProfiles: state.userProfiles,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
