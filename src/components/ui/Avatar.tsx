import { cn } from '@/lib/cn';
import { initialsFrom } from '@/lib/name';

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const;

/** Guests hold no account, so they have no role to read a tone from. */
export type AvatarTone = 'academic' | 'student' | 'guest' | 'admin';

const tones: Record<AvatarTone, string> = {
  academic: 'art-academic',
  student: 'art-student',
  guest: 'art-guest',
  admin: 'art-admin',
};

const toneByRole: Record<string, AvatarTone> = {
  STUDENT: 'student',
  LECTURER: 'academic',
  COURSE_COORDINATOR: 'academic',
  SYSTEM_ADMIN: 'admin',
  SUPER_ADMIN: 'admin',
};

export function Avatar({
  name,
  role,
  tone,
  size = 'md',
  className,
}: {
  name: string | undefined | null;
  /** Picks the tone. Comes from the API as a plain string. */
  role?: string | null;
  /** Overrides `role` — the only way to mark a guest, who has neither. */
  tone?: AvatarTone;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const resolved = tone ?? (role ? toneByRole[role] : undefined) ?? 'academic';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'avatar-art flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide text-white ring-2 ring-surface',
        tones[resolved],
        sizes[size],
        className,
      )}
    >
      {initialsFrom(name)}
    </span>
  );
}
