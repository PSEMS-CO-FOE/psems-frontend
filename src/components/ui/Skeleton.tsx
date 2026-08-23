import { cn } from '@/lib/cn';

/** A sweep, not a pulse — a fading block reads as broken. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-control bg-line/70', className)}
      aria-hidden="true"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-surface/70 to-transparent motion-safe:animate-shimmer" />
    </div>
  );
}

/** The app's single loading treatment: a card-shaped placeholder, not a spinner. */
export function SkeletonCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === rows - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

/** For loading inside a panel that already has its own card chrome — the same
 *  treatment without nesting a second card. */
export function SkeletonText({ rows = 2, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === rows - 1 ? 'w-1/2' : 'w-3/4')} />
      ))}
    </div>
  );
}
