import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * For a screen that sits inside a layout already carrying the page's `h1` — the
 * course tabs, where the layout names the course and this names the section.
 * Deliberately does not touch the top bar title: the bar should keep saying
 * which course you are in, not which tab.
 */
export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-6 gap-y-3', className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {/* A shorter echo of the page header's tick. */}
        <span
          aria-hidden="true"
          className="mt-1.5 h-4 w-0.5 shrink-0 rounded-pill bg-brand-400"
        />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          {description != null && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
