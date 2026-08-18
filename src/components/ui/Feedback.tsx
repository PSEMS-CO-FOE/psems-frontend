import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'critical' | 'positive' | 'caution' | 'info';

const tones: Record<Tone, string> = {
  critical: 'border-critical-500/30 bg-critical-50 text-critical-700',
  positive: 'border-positive-500/30 bg-positive-50 text-positive-700',
  caution: 'border-caution-500/30 bg-caution-50 text-caution-700',
  info: 'border-info-500/30 bg-info-50 text-info-700',
};

/** One voice for every inline message the app shows after an action. */
export function Notice({
  children,
  tone = 'info',
  size = 'sm',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  /** `xs` for dense panels. A prop rather than a className override, because
   *  `cn` concatenates and two type-scale classes would collide. */
  size?: 'sm' | 'xs';
  className?: string;
}) {
  return (
    <p
      role={tone === 'critical' ? 'alert' : 'status'}
      className={cn(
        'rounded-control border px-3 py-2',
        size === 'xs' ? 'text-xs' : 'text-sm',
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ErrorText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('text-xs font-medium text-critical-700', className)}>
      {children}
    </p>
  );
}
