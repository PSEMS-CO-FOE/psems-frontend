import { cn } from '@/lib/cn';

export interface MeterProps {
  label: string;
  value: number;
  /** The figure the value has to reach — 100 for every weight in PSEMS. */
  target: number;
  /** Compact drops the label and shrinks the bar, for a summary row. */
  density?: 'default' | 'compact';
  className?: string;
}

/** Weights must total 100. Shows how far off, next to the fields that set it. */
export function Meter({ label, value, target, density = 'default', className }: MeterProps) {
  const exact = value === target;
  const over = value > target;
  const pct = target === 0 ? 0 : Math.min(100, (value / target) * 100);

  const tone = exact ? 'bg-positive-500' : over ? 'bg-critical-500' : 'bg-caution-500';
  const text = exact ? 'text-positive-700' : over ? 'text-critical-700' : 'text-caution-700';

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        {density === 'default' && (
          <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            {label}
          </span>
        )}
        <span className={cn('text-xs font-semibold tnum', text)}>
          {value} / {target}
          {/* The gap, not just the total: "13 to go" is the number you act on. */}
          {!exact && (
            <span className="ml-1.5 font-medium">
              ({over ? `${value - target} over` : `${target - value} to go`})
            </span>
          )}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
        className={cn(
          'mt-1.5 w-full overflow-hidden rounded-pill bg-line',
          density === 'compact' ? 'h-1' : 'h-1.5',
        )}
      >
        <div
          className={cn('h-full rounded-pill transition-all duration-base ease-standard', tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
