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
        'group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface px-5 py-4 shadow-card',
        'transition-all duration-base ease-standard hover:border-brand-200 hover:shadow-raised',
        className,
      )}
    >
      {/* A wash in the corner, so the number is not floating on plain white. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-brand-wash transition-transform duration-slow ease-standard group-hover:scale-125"
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
          {label}
        </p>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
            {icon}
          </span>
        )}
      </div>

      <p className="relative mt-2.5 text-3xl font-semibold leading-none tracking-tight text-ink tnum">
        {value}
      </p>
      {caption != null && <p className="relative mt-2 text-xs text-ink-muted">{caption}</p>}
      {/* The spacer carries `mt-auto`, not the pill — two margin classes on one
          element would collide. */}
      {delta && (
        <div className="relative mt-auto pt-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium',
              deltaTone[delta.direction],
            )}
          >
            <span aria-hidden="true">{deltaGlyph[delta.direction]}</span>
            {delta.label}
          </span>
        </div>
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
