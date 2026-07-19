import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  // In memory only — never persisted. Null after a hard refresh until the
  // httpOnly refresh cookie re-issues one.
  accessToken: string | null;
  user: AuthUser | null;
  forcePasswordChange: boolean;

  setSession: (args: {
    accessToken: string;
    user: AuthUser;
    forcePasswordChange: boolean;
  }) => void;
  setAccessToken: (token: string) => void;
  clearForcePasswordChange: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  forcePasswordChange: false,

  setSession: ({ accessToken, user, forcePasswordChange }) =>
    set({ accessToken, user, forcePasswordChange }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearForcePasswordChange: () => set({ forcePasswordChange: false }),

  reset: () =>
    set({ accessToken: null, user: null, forcePasswordChange: false }),
}));
