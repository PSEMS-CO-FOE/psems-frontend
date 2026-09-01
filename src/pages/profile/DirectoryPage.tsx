import { useState } from 'react';
import { useDebounced } from '@/lib/useDebounced';
import { Link } from 'react-router-dom';
import { useProfileSearch, useResearchAreas, type UserProfile } from '@/features/profiles/useProfiles';
import { personName, shortName } from '@/lib/name';
import { profileShape } from '@/features/profiles/profileShape';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  SkeletonCard,
} from '@/components/ui';
import { cn } from '@/lib/cn';

function PersonCard({ profile }: { profile: UserProfile }) {
  const name = personName(profile.user);
  // Every role has its own label and tone already. The card used to ask only
  // "is this a student?", which billed administrators as lecturers.
  const shape = profileShape(profile.user.role);

  return (
    <Card interactive>
      <div className="flex items-start gap-3">
        <Avatar name={name} role={profile.user.role} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* The whole card is not a link: the interests inside it are their
                own filters, and nesting those in an anchor breaks both. */}
            <Link
              to={`/profile/${profile.userId}`}
              title={name}
              className="truncate text-sm font-semibold text-ink underline-offset-2 hover:text-brand-700 hover:underline"
            >
              {shortName(name)}
            </Link>
            <Badge tone={shape.badgeTone}>{shape.roleLabel}</Badge>
          </div>

          {profile.headline && (
            <p className="mt-0.5 truncate text-xs text-ink-muted">{profile.headline}</p>
          )}
          <p className="mt-0.5 truncate text-xs text-ink-subtle">
            {[profile.designation, profile.department].filter(Boolean).join(' · ') ||
              profile.user.email}
          </p>

          {profile.interests.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1">
              {profile.interests.slice(0, 4).map((i) => (
                <li key={i.id}>
                  <Badge tone="neutral">{i.area}</Badge>
                </li>
              ))}
              {profile.interests.length > 4 && (
                <li>
                  <Badge tone="neutral">+{profile.interests.length - 4}</Badge>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Browse people by what they work on. The search and the area list were both
 * built with the profiles and then called by nothing — a student choosing a
 * supervisor had no way to find one by subject, which is the whole reason
 * research interests are stored as tags rather than prose.
 */
export function DirectoryPage() {
  const [area, setArea] = useState('');
  const [q, setQ] = useState('');
  // Typing fired a request per keystroke against a table that grows every year.
  const debouncedQ = useDebounced(q);

  const { data: areas } = useResearchAreas();
  const {
    data: people,
    isLoading,
    isError,
    error,
  } = useProfileSearch({
    area: area || undefined,
    q: debouncedQ || undefined,
  });

  const filtered = Boolean(area || debouncedQ);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directory"
        eyebrow="Faculty of Engineering"
        description="Everyone with a profile. Filter by research area to find a supervisor who works on what you want to build."
        meta={
          people && (
            <span className="text-xs text-ink-muted">
              {people.length} {people.length === 1 ? 'person' : 'people'}
              {filtered ? ' match' : ''}
            </span>
          )
        }
      />

      <Card className="space-y-4">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Search
          </span>
          <div className="relative mt-2 max-w-md">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, headline or about"
              className="w-full rounded-control border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle transition duration-fast ease-standard hover:border-line-strong focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </label>

        {areas && areas.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
              Research area
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {[{ area: '', count: null }, ...areas].map((a) => {
                const selected = a.area === area;
                return (
                  <li key={a.area || 'all'}>
                    <button
                      type="button"
                      onClick={() => setArea(selected ? '' : a.area)}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors duration-fast ease-standard',
                        selected
                          ? 'bg-brand-600 text-white ring-brand-600'
                          : 'bg-surface text-ink-muted ring-line-strong hover:text-ink',
                      )}
                    >
                      {a.area || 'All'}
                      {a.count !== null && (
                        <span className={selected ? 'text-white/70' : 'text-ink-subtle'}>
                          {' '}
                          {a.count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load the directory')}</Notice>
      )}

      {isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </div>
      )}

      {people && people.length === 0 && (
        <EmptyState
          title="Nobody matches that"
          hint={
            filtered
              ? 'Try a different area, or clear the filters to see everyone.'
              : 'Profiles appear here once people fill them in.'
          }
        />
      )}

      {people && people.length > 0 && (
        <ul className="grid gap-4 lg:grid-cols-2">
          {people.map((p) => (
            <li key={p.id}>
              <PersonCard profile={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
