import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DisclosureProps {
  /** The row's own label — what this section is. */
  summary: ReactNode;
  /** Badges and counts. Put anything needed to decide whether to open it here. */
  meta?: ReactNode;
  /** Sits hard right, before the chevron: a weight, a total, a count. */
  aside?: ReactNode;
  children: ReactNode;
  /** Uncontrolled starting state. Ignored when `open` is passed. */
  defaultOpen?: boolean;
  /** With `onOpenChange`, drives it from outside — e.g. one open at a time. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Red border, for an error the reader would have to open the section to find. */
  invalid?: boolean;
  className?: string;
}

/** A foldable section, shared by the coordinator screens that were too long. */
export function Disclosure({
  summary,
  meta,
  aside,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  invalid,
  className,
}: DisclosureProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isOpen = open ?? uncontrolled;

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-control border bg-surface transition-colors duration-fast ease-standard',
        invalid ? 'border-critical-500/50' : isOpen ? 'border-line-strong shadow-raised' : 'border-line',
        className,
      )}
    >
      {/* A flex row, not a button: `aside` holds controls, and a button inside
          a button is invalid markup. */}
      <div
        className={cn(
          'relative flex items-center gap-2 pr-4 transition-colors duration-fast ease-standard',
          isOpen ? 'bg-canvas-sunken' : 'hover:bg-canvas-sunken/60',
        )}
      >
        {/* A brand edge marks the open one, instead of tinting the header. */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 w-[3px] transition-opacity duration-fast ease-standard',
            invalid ? 'bg-critical-500' : 'bg-brand-gradient',
            isOpen || invalid ? 'opacity-100' : 'opacity-0',
          )}
        />

        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 py-3 pl-5 pr-2 text-left"
        >
          <span className="text-sm font-semibold tracking-tight text-ink">{summary}</span>
          {meta}
        </button>

        <span className="flex shrink-0 items-center gap-3">
          {aside}
          <button
            type="button"
            onClick={toggle}
            tabIndex={-1}
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                'h-4 w-4 text-ink-subtle transition-transform duration-base ease-standard',
                isOpen && 'rotate-180',
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </span>
      </div>

      {isOpen && <div className="border-t border-line">{children}</div>}
    </div>
  );
}
