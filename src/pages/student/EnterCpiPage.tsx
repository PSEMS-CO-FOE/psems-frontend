import { Link } from 'react-router-dom';
import { useStudentCpis } from '@/features/courses/useCourses';
import { getApiErrorMessage } from '@/lib/apiError';
import { Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';

// Students pick from the CPIs available to them (their department + any they've
// joined) — no CPI id to type.
export function EnterCpiPage() {
  const { data: cpis, isLoading, isError, error } = useStudentCpis();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        description="Open a course to form your group, browse ideas and track your project."
      />

      {isLoading && <SkeletonCard rows={3} />}

      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load your courses')}</Notice>
      )}

      {cpis && cpis.length === 0 && (
        <EmptyState
          title="No courses open to you yet"
          hint="Courses appear here once your coordinator sets one up for your department."
        />
      )}

      {cpis && cpis.length > 0 && (
        <ul className="space-y-3">
          {cpis.map((cpi) => (
            <li key={cpi.id}>
              {/* A link, not a button: opening a course in a new tab is a normal
                  thing to want, and `navigate` throws that away. */}
              <Link to={`/student/cpi/${cpi.id}/group`} className="block">
                <Card className="transition-shadow duration-fast ease-standard hover:shadow-raised">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{cpi.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {cpi.department} · {cpi.academicYear}
                      </p>
                    </div>
                    <span aria-hidden="true" className="shrink-0 text-sm text-ink-subtle">
                      →
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
