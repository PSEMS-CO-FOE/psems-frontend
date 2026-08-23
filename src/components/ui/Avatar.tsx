import { cn } from '@/lib/cn';
import { initialsFrom } from '@/lib/name';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string | undefined | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold tracking-wide text-white shadow-brand ring-2 ring-surface',
        sizes[size],
        className,
      )}
    >
      {initialsFrom(name)}
    </span>
  );
}
