import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Sits opposite the label, e.g. a help link. */
  aside?: ReactNode;
}

/** The signed-out pages use a taller field with a small-caps label; the in-app
 *  `Field` is denser because those screens are forms among many other things. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, aside, className, ...props },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted"
        >
          {label}
        </label>
        {aside}
      </div>
      <input
        {...props}
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'mt-2 w-full rounded-control border bg-surface px-4 py-3 text-sm text-ink shadow-card outline-none transition duration-fast ease-standard placeholder:text-ink-subtle',
          'hover:border-line-strong focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15',
          error ? 'border-critical-500' : 'border-line',
          className,
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-critical-700">
          {error}
        </p>
      )}
    </div>
  );
});
