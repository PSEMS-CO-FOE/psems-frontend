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
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description != null && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
