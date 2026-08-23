import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface InfoTipProps {
  /** What this control is, used to name the button for a screen reader —
   *  "More about Weight" rather than a page of identical "info" buttons. */
  label: string;
  /** The explanation. Say what the setting does and what happens either way;
   *  a tip that only restates the label is worse than no tip. */
  children: ReactNode;
  className?: string;
}

const WIDTH = 288; // 18rem
const GAP = 8;
const MARGIN = 12;

/**
 * The round "i" beside a setting. Click, not hover, so it works on touch and
 * from the keyboard. Portalled to `body` because cards clip their contents.
 */
export function InfoTip({ label, children, className }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const height = panelRef.current?.offsetHeight ?? 160;

    // Below the button unless that would run off the bottom, in which case
    // above it. Same idea horizontally against the right edge.
    const below = r.bottom + GAP;
    const flipUp = below + height > window.innerHeight - MARGIN && r.top - GAP - height > MARGIN;
    const preferred = flipUp ? r.top - GAP - height : below;

    // Then clamp both axes regardless. Flipping alone still leaves the panel
    // off-screen when the trigger itself is — a short window, or a click driven
    // from the keyboard before the browser has scrolled the button into view.
    const top = Math.min(Math.max(MARGIN, preferred), Math.max(MARGIN, window.innerHeight - height - MARGIN));
    const left = Math.min(Math.max(MARGIN, r.left), Math.max(MARGIN, window.innerWidth - WIDTH - MARGIN));

    setPos({ top, left });
  }, []);

  // Before paint, so the panel never appears in the wrong place first.
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    // A tip anchored to a button that has scrolled away is worse than no tip.
    const onReflow = () => setOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`More about ${label}`}
        className={cn(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full align-middle',
          'text-[10px] font-semibold leading-none ring-1 ring-inset transition-colors duration-fast ease-standard',
          open
            ? 'bg-brand-600 text-white ring-brand-600'
            : 'text-ink-subtle ring-line-strong hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200',
          className,
        )}
      >
        i
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role="note"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: WIDTH,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className="fixed z-50 rounded-control border border-line bg-surface-raised p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink-muted shadow-pop motion-safe:animate-rise"
          >
            <span className="mb-1 block text-[11px] font-semibold text-ink">{label}</span>
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
