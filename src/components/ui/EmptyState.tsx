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
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-canvas/60 px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint != null && <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-muted">{hint}</p>}
      {action != null && <div className="mt-4">{action}</div>}
    </div>
  );
}
