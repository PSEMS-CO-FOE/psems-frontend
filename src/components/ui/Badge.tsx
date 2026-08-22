import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'positive' | 'caution' | 'critical' | 'info';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-line/60 text-ink-muted ring-line-strong',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  positive: 'bg-positive-50 text-positive-700 ring-positive-500/25',
  caution: 'bg-caution-50 text-caution-700 ring-caution-500/25',
  critical: 'bg-critical-50 text-critical-700 ring-critical-500/25',
  info: 'bg-info-50 text-info-700 ring-info-500/25',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
