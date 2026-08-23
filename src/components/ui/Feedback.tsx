import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'critical' | 'positive' | 'caution' | 'info';

const tones: Record<Tone, string> = {
  critical: 'border-critical-500/30 bg-critical-50 text-critical-700',
  positive: 'border-positive-500/30 bg-positive-50 text-positive-700',
  caution: 'border-caution-500/30 bg-caution-50 text-caution-700',
  info: 'border-info-500/30 bg-info-50 text-info-700',
};

// One glyph per tone, so tint is not the only signal.
const glyphs: Record<Tone, string> = {
  critical: 'M12 9v4M12 17h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  positive: 'M20 6 9 17l-5-5',
  caution: 'M12 8v4M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  info: 'M12 16v-4M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
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
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-control border px-3.5 py-2.5 leading-relaxed',
        size === 'xs' ? 'text-xs' : 'text-sm',
        tones[tone],
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={glyphs[tone]} />
      </svg>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function ErrorText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('text-xs font-medium text-critical-700', className)}>
      {children}
    </p>
  );
}
