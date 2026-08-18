import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type DeltaDirection = 'up' | 'down' | 'flat';

export interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  /** Sits under the value — the denominator, the qualifier, the caveat. */
  caption?: ReactNode;
  /** Change against a previous period. Direction carries a glyph as well as a
   *  colour, so it survives being read in greyscale or by a colour-blind eye. */
  delta?: { direction: DeltaDirection; label: ReactNode };
  icon?: ReactNode;
  className?: string;
}

const deltaTone: Record<DeltaDirection, string> = {
  up: 'bg-positive-50 text-positive-700',
  down: 'bg-critical-50 text-critical-700',
  flat: 'bg-line/60 text-ink-muted',
};

const deltaGlyph: Record<DeltaDirection, string> = { up: '▲', down: '▼', flat: '■' };

export function StatTile({ label, value, caption, delta, icon, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface px-5 py-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink [font-variant-numeric:tabular-nums]">
        {value}
      </p>
      {caption != null && <p className="mt-1 text-xs text-ink-muted">{caption}</p>}
      {delta && (
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            deltaTone[delta.direction],
          )}
        >
          <span aria-hidden="true">{deltaGlyph[delta.direction]}</span>
          {delta.label}
        </span>
      )}
    </div>
  );
}

/** Stat tiles are always a row; this keeps the count and gaps consistent. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
  );
}
