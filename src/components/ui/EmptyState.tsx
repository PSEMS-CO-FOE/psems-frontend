import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  /** What is missing, stated plainly. */
  title: ReactNode;
  /** What the reader should do next — the reason this component exists. */
  hint?: ReactNode;
  action?: ReactNode;
  /** `compact` for a panel that already has its own chrome: same words, no
   *  second dashed card around them. */
  density?: 'default' | 'compact';
  className?: string;
}

export function EmptyState({
  title,
  hint,
  action,
  density = 'default',
  className,
}: EmptyStateProps) {
  if (density === 'compact') {
    return (
      <div className={cn('py-3 text-left', className)}>
        <p className="text-xs font-medium text-ink">{title}</p>
        {hint != null && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{hint}</p>}
        {action != null && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center',
        className,
      )}
    >
      {/* A mark, not an illustration — one drawing per empty state is a burden. */}
      <span
        aria-hidden="true"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-brand-wash text-brand-700 ring-1 ring-inset ring-brand-200"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5ZM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint != null && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-muted">{hint}</p>
      )}
      {action != null && <div className="mt-4">{action}</div>}
    </div>
  );
}
