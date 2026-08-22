import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'psems-theme';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;
}

function apply(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark');
}

function stored(): ThemePreference {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Cycles light → dark → follow the OS, which is the third state a plain
   *  on/off toggle cannot express. */
  cycle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: stored(),

  setPreference: (preference) => {
    localStorage.setItem(STORAGE_KEY, preference);
    apply(preference);
    set({ preference });
  },

  cycle: () => {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(get().preference) + 1) % order.length];
    get().setPreference(next);
  },
}));

// Track the OS while the preference is "system"; without this the app only
// follows it at load and then drifts.
export function watchSystemTheme(): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (useThemeStore.getState().preference === 'system') apply('system');
  };
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
