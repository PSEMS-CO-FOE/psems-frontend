import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetShellTitle } from '@/components/layout/shellTitle';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small "← somewhere" control above the title. Omit `to` to step back in
   *  history instead, for a page reachable from several different places. */
  back?: { label: string; to?: string };
  actions?: ReactNode;
  /** Status chips, phase pills, counts — sits under the title. */
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, back, actions, meta, className }: PageHeaderProps) {
  // Only a plain string can be echoed in the top bar; a composed title stays
  // on the page and the bar falls back to the role name.
  useSetShellTitle(typeof title === 'string' ? title : null);
  const navigate = useNavigate();

  const backClass =
    'inline-flex items-center gap-1 rounded-control text-xs font-medium text-ink-muted transition-colors duration-fast ease-standard hover:text-brand-700';

  return (
    <header className={cn('space-y-2', className)}>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
          {description != null && (
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          )}
        </div>
        {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {meta != null && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
    </header>
  );
}
