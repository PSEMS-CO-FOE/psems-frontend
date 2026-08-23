import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useOtherBatchCpis,
  useRequestToJoin,
  useStudentCpis,
  type StudentCpi,
} from '@/features/courses/useCourses';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  SectionHeader,
  SkeletonCard,
} from '@/components/ui';

function CourseCard({ cpi }: { cpi: StudentCpi }) {
  return (
    <li>
      {/* A link, not a button: opening a course in a new tab is a normal thing
          to want, and `navigate` throws that away. */}
      <Link to={`/student/cpi/${cpi.id}/group`} className="group block">
        <Card interactive>
          <div className="flex items-center gap-4">
            {/* An initial to aim at, instead of three lines of grey text. */}
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-brand-wash text-base font-semibold text-brand-700 ring-1 ring-inset ring-brand-200"
            >
              {cpi.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{cpi.name}</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {cpi.batch} · {cpi.department} · {cpi.academicYear}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {cpi.status === 'ARCHIVED' && <Badge tone="neutral">Finished</Badge>}
              <span
                aria-hidden="true"
                className="text-base text-ink-subtle transition-transform duration-base ease-standard group-hover:translate-x-1 group-hover:text-brand-700"
              >
                →
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </li>
  );
}

// A student who was repeated can ask to take a course with a later batch. They
// can see its name and batch here — never its contents — which is what lets them
// name the one they want without the course being open to them.
function OtherBatches() {
  const { data: courses } = useOtherBatchCpis();
  const requestToJoin = useRequestToJoin();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Record<string, string>>({});

  if (!courses || courses.length === 0) return null;

  return (
    <Card
      title="Taking a course with another batch"
      description="If you are repeating a module, ask your coordinator to add you to the batch running it now."
      actions={
        <Button variant="neutral" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show courses'}
        </Button>
      }
    >
      {open && (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course.id} className="rounded-control border border-line p-3">
              <p className="text-sm text-ink">
                {course.name} <Badge tone="neutral">{course.batch}</Badge>
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {course.projectType} · {course.academicYear}
              </p>

              {course.request?.status === 'PENDING' && (
                <p className="mt-2 text-xs text-ink-muted">Waiting for your coordinator to decide.</p>
              )}
              {course.request?.status === 'APPROVED' && (
                <p className="mt-2 text-xs text-ink-muted">You were added — it is in your courses above.</p>
              )}

              {course.request?.status !== 'PENDING' && course.request?.status !== 'APPROVED' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={reason[course.id] ?? ''}
                    onChange={(e) => setReason({ ...reason, [course.id]: e.target.value })}
                    placeholder="Why you need to take this course"
                    className="flex-1 rounded-control border border-line-strong px-2 py-1 text-xs"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => requestToJoin.mutate({ cpiId: course.id, reason: reason[course.id] ?? '' })}
                    disabled={!reason[course.id]?.trim() || requestToJoin.isPending}
                  >
                    Ask to join
                  </Button>
                </div>
              )}
              {course.request?.status === 'REJECTED' && (
                <p className="mt-1 text-xs text-ink-muted">A previous request was declined.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {requestToJoin.isError && <Notice tone="critical">{getApiErrorMessage(requestToJoin.error)}</Notice>}
    </Card>
  );
}

export function EnterCpiPage() {
  const { data: cpis, isLoading, isError, error } = useStudentCpis();

  // Archived courses are ones the student took and finished; they stay readable
  // but do not belong beside the work in front of them.
  const current = cpis?.filter((c) => c.status !== 'ARCHIVED') ?? [];
  const past = cpis?.filter((c) => c.status === 'ARCHIVED') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        eyebrow="Student"
        description="Open a course to form your group, browse ideas and track your project."
      />

      {isLoading && <SkeletonCard rows={3} />}

      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load your courses')}</Notice>
      )}

      {cpis && cpis.length === 0 && (
        <EmptyState
          title="No courses open to you yet"
          hint="A course appears here once your coordinator publishes one for your batch."
        />
      )}

      {current.length > 0 && (
        <section className="space-y-3">
          {past.length > 0 && <SectionHeader title="Current" />}
          <ul className="space-y-3">
            {current.map((cpi) => (
              <CourseCard key={cpi.id} cpi={cpi} />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Past" description="Courses you have already taken." />
          <ul className="space-y-3">
            {past.map((cpi) => (
              <CourseCard key={cpi.id} cpi={cpi} />
            ))}
          </ul>
        </section>
      )}

      <OtherBatches />
    </div>
  );
}
