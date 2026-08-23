import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'success'
  | 'caution'
  | 'danger'
  | 'danger-quiet'
  | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  // The gradient and its green-tinted shadow are what mark the single most
  // important action on a screen; every other variant is deliberately flat.
  primary:
    'bg-brand-gradient text-white shadow-brand hover:shadow-brand-lg hover:brightness-105 active:brightness-95',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-card hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-50',
  // Dark neutral for the many secondary actions inside tables and panels, so
  // the green stays reserved for the one primary action on a screen.
  neutral: 'bg-ink text-white shadow-card hover:bg-ink-muted',
  caution: 'bg-caution-500 text-white shadow-card hover:bg-caution-700',
  danger: 'bg-critical-500 text-white shadow-card hover:bg-critical-700',
  success: 'bg-positive-500 text-white shadow-card hover:bg-positive-700',
  // A quiet destructive action. A variant, not `ghost` plus a colour class:
  // two `text-*` classes collide and Tailwind's output order decides.
  'danger-quiet':
    'border border-critical-500/35 bg-critical-50 text-critical-700 hover:border-critical-500/60 hover:bg-critical-50 active:bg-critical-50',
  ghost: 'text-ink-muted hover:bg-line/50 hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

function buttonClass(variant: Variant, size: Size, fullWidth?: boolean, className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-medium',
    'transition-all duration-fast ease-standard',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, fullWidth, className)}
      {...props}
    />
  );
});

export interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

/** A navigation that should look like a button. Keeping it an anchor preserves
 *  middle-click, "open in new tab" and the browser's own link affordances,
 *  which a `<button onClick={navigate}>` throws away. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, fullWidth, className)} {...props} />;
}
