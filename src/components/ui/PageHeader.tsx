import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetShellTitle } from '@/components/layout/shellTitle';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small caps line above the title — the scope the title sits inside, e.g.
   *  the course code or the section. Omit rather than repeat the title. */
  eyebrow?: ReactNode;
  /** Small "← somewhere" control above the title. Omit `to` to step back in
   *  history instead, for a page reachable from several different places. */
  back?: { label: string; to?: string };
  actions?: ReactNode;
  /** Status chips, phase pills, counts — sits under the title. */
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  // Only a plain string can be echoed in the top bar; a composed title stays
  // on the page and the bar falls back to the role name.
  useSetShellTitle(typeof title === 'string' ? title : null);
  const navigate = useNavigate();

  const backClass =
    'inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted ring-1 ring-inset ring-line transition-colors duration-fast ease-standard hover:text-brand-700 hover:ring-brand-200';

  return (
    <header className={cn('relative pb-5', className)}>
      {back &&
        (back.to ? (
          <Link to={back.to} className={backClass}>
            <span aria-hidden="true">←</span>
            {back.label}
          </Link>
        ) : (
          <button type="button" onClick={() => navigate(-1)} className={backClass}>
            <span aria-hidden="true">←</span>
            {back.label}
          </button>
        ))}

      <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', back && 'mt-3')}>
        {/* The one mark every screen shares. */}
        <div className="flex min-w-0 flex-1 gap-3.5">
          <span
            aria-hidden="true"
            className="mt-1 h-[1.9rem] w-1 shrink-0 rounded-pill bg-brand-gradient"
          />
          <div className="min-w-0">
            {eyebrow != null && (
              <p className="mb-1 truncate text-[10px] font-semibold uppercase tracking-eyebrow text-brand-700">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate text-title font-semibold text-ink">{title}</h1>
            {description != null && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {meta != null && <div className="mt-3.5 flex flex-wrap items-center gap-2">{meta}</div>}

      {/* Fades out, so it separates without cutting the page in two. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-line via-line/60 to-transparent"
      />
    </header>
  );
}
