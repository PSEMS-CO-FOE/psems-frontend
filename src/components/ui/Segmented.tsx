import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** For switching a view in place — a sub-mode of one screen, not a route.
 *  Use TabNav when the choice deserves its own URL. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "Marks view". */
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-pill bg-canvas-sunken p-1 ring-1 ring-inset ring-line',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'whitespace-nowrap rounded-pill px-4 py-1.5 text-sm font-medium transition-all duration-fast ease-standard',
              selected
                ? 'bg-brand-gradient text-white shadow-brand'
                : 'text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
