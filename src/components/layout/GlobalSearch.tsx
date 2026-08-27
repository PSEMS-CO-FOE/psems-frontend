import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useProfileSearch } from '@/features/profiles/useProfiles';

interface CourseHit {
  id: string;
  name: string;
  department: string;
  academicYear: string;
}

// Each role reads its courses from a different endpoint; asking for the wrong
// one is a 403, so the role picks the path rather than trying all three.
const coursePathByRole: Record<string, string | null> = {
  STUDENT: '/courses/mine/student',
  LECTURER: '/courses/mine/lecturer',
  COURSE_COORDINATOR: '/courses',
  SYSTEM_ADMIN: null,
};

function useSearchableCourses() {
  const role = useAuthStore((s) => s.user?.role);
  const path = role ? coursePathByRole[role] : null;

  return useQuery({
    queryKey: ['search', 'courses', path],
    enabled: Boolean(path),
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api.get<CourseHit[]>(path as string);
      return res.data;
    },
  });
}

function courseHref(role: string | undefined, id: string): string {
  if (role === 'STUDENT') return `/student/cpi/${id}`;
  if (role === 'LECTURER') return `/lecturer/cpi/${id}`;
  return `/coordinator/${id}`;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);

  const trimmed = query.trim();
  const active = open && trimmed.length >= 2;

  const { data: courses } = useSearchableCourses();
  // Guests hold no account and never reach the shell, but the directory is
  // still a network call per keystroke without a floor on the query length.
  const { data: people } = useProfileSearch({ q: trimmed }, active);

  const courseHits = (courses ?? [])
    .filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 5);
  const peopleHits = (people ?? []).slice(0, 5);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    setQuery('');
    navigate(to);
  };

  const empty = active && courseHits.length === 0 && peopleHits.length === 0;

  return (
    <div ref={containerRef} className="relative hidden flex-1 justify-end sm:flex">
      <label className="relative w-full max-w-sm">
        <span className="sr-only">Search courses and people</span>
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
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search courses, people"
          className="h-10 w-full rounded-pill border border-line bg-canvas-sunken pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle transition-colors duration-fast ease-standard hover:border-line-strong focus:border-brand-500 focus:bg-surface"
        />

      </label>

      {active && (
        <div className="absolute right-0 top-full z-30 mt-2 w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface-raised shadow-pop motion-safe:animate-rise">
          {empty && <p className="px-4 py-6 text-center text-xs text-ink-subtle">Nothing matches “{trimmed}”.</p>}

          {courseHits.length > 0 && (
            <section>
              <h2 className="border-b border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
                Courses
              </h2>
              <ul>
                {courseHits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => go(courseHref(role, c.id))}
                      className="block w-full px-4 py-2.5 text-left transition-colors duration-fast ease-standard hover:bg-brand-50"
                    >
                      <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                      <span className="block text-xs text-ink-muted">
                        {c.department} · {c.academicYear}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {peopleHits.length > 0 && (
            <section>
              <h2 className="border-y border-line px-4 py-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
                People
              </h2>
              <ul>
                {peopleHits.map((p) => (
                  <li key={p.userId}>
                    <button
                      type="button"
                      onClick={() => go(`/profile/${p.userId}`)}
                      className="block w-full px-4 py-2.5 text-left transition-colors duration-fast ease-standard hover:bg-brand-50"
                    >
                      <span className="block truncate text-sm font-medium text-ink">
                        {p.user.fullName ?? p.user.email}
                      </span>
                      {p.headline && (
                        <span className="block truncate text-xs text-ink-muted">{p.headline}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
