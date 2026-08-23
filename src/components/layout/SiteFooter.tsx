import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';

const YEAR = new Date().getFullYear();

export interface SiteFooterProps {
  /**
   * `inset` starts the bar where the content does, clearing the sidebar rail;
   * `full` spans the viewport, for the screens that have no rail.
   */
  variant?: 'inset' | 'full';
  className?: string;
}

/**
 * A fixed bar, so it stays in one place instead of floating mid-page. Its
 * height and offsets come from `--footer-h`, `--rail-w` and `--content-max`.
 */
export function SiteFooter({ variant = 'full', className }: SiteFooterProps) {
  // The guide needs a session, so signed-out readers get the reset link instead.
  const signedIn = useAuthStore((s) => Boolean(s.accessToken && s.user));

  return (
    <footer
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 h-[var(--footer-h)] border-t border-line surface-glass',
        variant === 'inset' && 'lg:left-[var(--rail-w)]',
        className,
      )}
    >
      <div className="mx-auto flex h-full max-w-[var(--content-max)] items-center gap-3 px-4 text-xs sm:px-6">
        <p className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 font-semibold tracking-tight text-ink">PSEMS</span>
          {/* First to go on a narrow screen; the links are the point. */}
          <span className="hidden truncate text-ink-muted xl:inline">
            Project Scoring, Evaluation &amp; Management System
          </span>
          <span className="hidden truncate text-ink-muted sm:inline xl:hidden">
            Faculty of Engineering, USJ
          </span>
        </p>

        <nav aria-label="Footer" className="ml-auto flex shrink-0 items-center gap-1">
          {signedIn ? (
            <Link
              to="/guide"
              className="rounded-pill px-2.5 py-1 font-medium text-brand-700 transition-colors duration-fast ease-standard hover:bg-brand-50"
            >
              How to use PSEMS
            </Link>
          ) : (
            <Link
              to="/forgot-password"
              className="rounded-pill px-2.5 py-1 font-medium text-brand-700 transition-colors duration-fast ease-standard hover:bg-brand-50"
            >
              Trouble signing in?
            </Link>
          )}
          <a
            href="https://eng.sjp.ac.lk"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-pill px-2.5 py-1 text-ink-muted transition-colors duration-fast ease-standard hover:bg-line/50 hover:text-ink sm:inline-block"
          >
            Faculty website
          </a>
          <span className="hidden pl-2 text-ink-subtle md:inline">&copy; {YEAR}</span>
        </nav>
      </div>
    </footer>
  );
}
