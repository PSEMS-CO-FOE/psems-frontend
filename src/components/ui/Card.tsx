import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered on the header's right, e.g. a save button or a status badge. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Drops the inner padding for tables and grids that manage their own. */
  flush?: boolean;
  /** A brand edge along the top. For the one panel on a screen that should be
   *  found first — a second accented card cancels out the first. */
  accent?: boolean;
  /** Lifts on hover. Only for a card that is itself a link or a button. */
  interactive?: boolean;
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  flush,
  accent,
  interactive,
}: CardProps) {
  const hasHeader = title != null || description != null || actions != null;

  return (
    <section
      className={cn(
        'rounded-card border border-line bg-surface shadow-raised',
        accent && 'card-accent',
        interactive &&
          'transition-all duration-base ease-standard hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised',
        className,
      )}
    >
      {hasHeader && (
        <header
          className={cn(
            'flex items-start justify-between gap-4 px-5 py-4',
            children != null && 'border-b border-line',
          )}
        >
          <div className="min-w-0">
            {title != null && (
              <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
            )}
            {description != null && (
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
            )}
          </div>
          {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children != null && <div className={cn(!flush && 'px-5 py-4')}>{children}</div>}
    </section>
  );
}
