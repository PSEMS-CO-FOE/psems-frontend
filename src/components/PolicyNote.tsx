import { Link } from 'react-router-dom';
import { useCpiPolicy, type CpiPolicy } from '@/features/policy/usePolicy';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/cn';

/**
 * States, read-only, which course settings govern the screen you are on.
 *
 * The settings themselves live in one place so a course can be set up in one
 * sitting; this is the other half of that bargain — you tick "only the group
 * leader posts" on the settings screen, and the Ideas screen says so rather
 * than leaving everyone to infer it from a button that isn't there.
 *
 * Returns null when every line is null, so a screen with nothing worth saying
 * shows nothing at all.
 */
export function PolicyNote({
  cpiId,
  lines,
  className,
}: {
  cpiId: string;
  lines: (policy: CpiPolicy) => (string | false | null | undefined)[];
  className?: string;
}) {
  const { data: policy } = useCpiPolicy(cpiId);
  const isCoordinator = useAuthStore((s) => s.user?.role === 'COURSE_COORDINATOR');

  if (!policy) return null;
  const text = lines(policy).filter((l): l is string => typeof l === 'string' && l.length > 0);
  if (text.length === 0) return null;

  return (
    <aside
      className={cn(
        'rounded-control border border-line bg-canvas/60 px-3 py-2 text-xs text-ink-muted',
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium text-ink">Set by this course</span>
        {isCoordinator && (
          <Link to={`/coordinator/${cpiId}/setup`} className="font-medium text-brand-700 hover:underline">
            Change in course settings
          </Link>
        )}
      </div>
      <ul className="mt-1 space-y-0.5">
        {text.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
