import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const controlClass =
  'w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-subtle transition-colors ' +
  'hover:border-ink-subtle focus:border-brand-500 ' +
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-subtle';

const invalidClass = 'border-critical-500 hover:border-critical-500 focus:border-critical-500';

interface Wrapper {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
}

function Labelled({
  id,
  label,
  hint,
  error,
  className,
  children,
}: Wrapper & { id: string; children: ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label != null && (
        <label htmlFor={id} className="block text-xs font-medium text-ink-muted">
          {label}
        </label>
      )}
      {children}
      {hint != null && error == null && <p className="text-xs text-ink-subtle">{hint}</p>}
      {error != null && (
        <p id={`${id}-error`} className="text-xs font-medium text-critical-700">
          {error}
        </p>
      )}
    </div>
  );
}

export type FieldProps = Wrapper & InputHTMLAttributes<HTMLInputElement>;

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Labelled id={fieldId} label={label} hint={hint} error={error} className={className}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error != null || undefined}
        aria-describedby={error != null ? `${fieldId}-error` : undefined}
        className={cn(controlClass, error != null && invalidClass)}
        {...props}
      />
    </Labelled>
  );
});

export type SelectFieldProps = Wrapper & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectFieldProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Labelled id={fieldId} label={label} hint={hint} error={error} className={className}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error != null || undefined}
        className={cn(controlClass, 'pr-8', error != null && invalidClass)}
        {...props}
      >
        {children}
      </select>
    </Labelled>
  );
});

export type TextareaProps = Wrapper & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Labelled id={fieldId} label={label} hint={hint} error={error} className={className}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error != null || undefined}
        className={cn(controlClass, 'min-h-[5rem] resize-y', error != null && invalidClass)}
        {...props}
      />
    </Labelled>
  );
});
