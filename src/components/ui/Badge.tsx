import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'positive' | 'caution' | 'critical' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-line/50 text-ink-muted ring-line-strong',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  positive: 'bg-positive-50 text-positive-700 ring-positive-500/30',
  caution: 'bg-caution-50 text-caution-700 ring-caution-500/30',
  critical: 'bg-critical-50 text-critical-700 ring-critical-500/30',
  info: 'bg-info-50 text-info-700 ring-info-500/30',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-ink-subtle',
  brand: 'bg-brand-500',
  positive: 'bg-positive-500',
  caution: 'bg-caution-500',
  critical: 'bg-critical-500',
  info: 'bg-info-500',
};

export function Badge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  /** A filled dot in the tone's colour. For a badge that reports a live state
   *  rather than a fixed label, where the tint alone is easy to skim past. */
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-medium leading-5 ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}
