import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  // In memory only — never persisted. Null after a hard refresh until the
  // httpOnly refresh cookie re-issues one.
  accessToken: string | null;
  user: AuthUser | null;
  forcePasswordChange: boolean;
  // False until the refresh cookie has been tried once. The router must not
  // treat "no token yet" as "signed out" before that attempt finishes.
  restored: boolean;

  setSession: (args: {
    accessToken: string;
    user: AuthUser;
    forcePasswordChange: boolean;
  }) => void;
  setAccessToken: (token: string) => void;
  clearForcePasswordChange: () => void;
  markRestored: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  forcePasswordChange: false,
  restored: false,

  setSession: ({ accessToken, user, forcePasswordChange }) =>
    set({ accessToken, user, forcePasswordChange, restored: true }),

  setAccessToken: (token) => set({ accessToken: token }),

  clearForcePasswordChange: () => set({ forcePasswordChange: false }),

  markRestored: () => set({ restored: true }),

  // restored stays true: signing out is an answer, not an unfinished attempt.
  reset: () =>
    set({ accessToken: null, user: null, forcePasswordChange: false, restored: true }),
}));
