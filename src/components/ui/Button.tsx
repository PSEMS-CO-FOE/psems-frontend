import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'neutral' | 'success' | 'caution' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-canvas active:bg-line/40',
  // Dark neutral for the many secondary actions inside tables and panels, so
  // the green stays reserved for the one primary action on a screen.
  neutral: 'bg-ink text-white hover:bg-ink-muted',
  caution: 'bg-caution-500 text-white hover:bg-caution-700',
  danger: 'bg-critical-500 text-white hover:bg-critical-700',
  success: 'bg-positive-500 text-white hover:bg-positive-700',
  ghost: 'text-ink-muted hover:bg-line/50 hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1',
  md: 'h-9 px-3.5 text-sm gap-1.5',
  lg: 'h-11 px-5 text-sm gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

function buttonClass(variant: Variant, size: Size, fullWidth?: boolean, className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-control font-medium transition-colors duration-fast ease-standard',
    'disabled:cursor-not-allowed disabled:opacity-50',
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
