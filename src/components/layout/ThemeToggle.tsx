import { useThemeStore, type ThemePreference } from '@/stores/themeStore';
import { cn } from '@/lib/cn';

const next: Record<ThemePreference, string> = {
  light: 'Switch to dark theme',
  dark: 'Follow the system theme',
  system: 'Switch to light theme',
};

const glyph: Record<ThemePreference, string> = {
  light: 'M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  system: 'M4 5h16v10H4zM8 19h8M12 15v4',
};

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useThemeStore((s) => s.preference);
  const cycle = useThemeStore((s) => s.cycle);

  return (
    <button
      type="button"
      onClick={cycle}
      title={next[preference]}
      aria-label={next[preference]}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast ease-standard hover:bg-line/50 hover:text-ink',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={glyph[preference]} />
      </svg>
    </button>
  );
}
