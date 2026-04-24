import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TokenResponse } from '@/features/auth/types';

interface AuthState {
  token: string | null;
  expiresAt: number | null;
  setSession: (token: TokenResponse) => void;
  clearToken: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      setSession: (response) =>
        set({
          token: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        }),
      clearToken: () => set({ token: null, expiresAt: null }),
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return expiresAt > Date.now();
      },
    }),
    {
      name: 'ztract.auth',
      partialize: (state) => ({ token: state.token, expiresAt: state.expiresAt }),
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && state.expiresAt <= Date.now()) {
          state.token = null;
          state.expiresAt = null;
        }
      },
    },
  ),
);
