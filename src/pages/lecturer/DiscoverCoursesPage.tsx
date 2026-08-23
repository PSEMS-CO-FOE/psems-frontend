import { useState } from 'react';
import { useOpenCourses, useRequestToSupervise, type OpenCourse } from '@/features/courses/useSupervisorRequests';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, PageHeader, SkeletonText } from '@/components/ui';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Request pending',
  APPROVED: 'Approved — check your invitations',
  REJECTED: 'Not taken up',
};

function CourseCard({ course }: { course: OpenCourse }) {
  const request = useRequestToSupervise();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">{course.name}</p>
          <p className="text-xs text-ink-muted">
            {course.department} · {course.academicYear} · {course.projectType}
          </p>
          <p className="mt-0.5 text-xs text-ink-subtle">
            Coordinated by {course.createdBy.fullName ?? course.createdBy.email} · {course._count.groups} group(s) ·{' '}
            {course._count.supervisors} supervisor(s)
          </p>
        </div>
        {course.requestStatus ? (
          <span className="rounded-control bg-canvas-sunken px-2 py-0.5 text-xs text-ink-muted">
            {STATUS_LABEL[course.requestStatus]}
          </span>
        ) : (
          <Button variant="primary" size="sm"
            onClick={() => setOpen((v) => !v)}>
            Ask to supervise
          </Button>
        )}
      </div>

      {open && !course.requestStatus && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Optional — a lecturer can simply ask. */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why you'd like to supervise (optional)"
            className="flex-1 rounded-control border border-line-strong px-2 py-1 text-xs"
          />
          <Button variant="neutral" size="sm"
            onClick={() => request.mutate({ cpiId: course.id, note: note.trim() || undefined })}
            disabled={request.isPending}>
            {request.isPending ? '…' : 'Send request'}
          </Button>
        </div>
      )}
      {request.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(request.error)}</p>}
    </Card>
  );
}

// Courses a lecturer is not on yet. Deliberately shows course details only —
// never the ideas inside, since accepted supervisors can see groups' restricted
// ideas and a lecturer is not one yet.
export function DiscoverCoursesPage() {
  const { data, isLoading } = useOpenCourses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find courses"
        eyebrow="Supervisor & evaluator"
        description="Courses you are not on. Asking to supervise sends a request to the coordinator; if they approve it, you get an invitation to accept."
      />
      {isLoading && <SkeletonText />}
      {data?.map((c) => <CourseCard key={c.id} course={c} />)}
      {data && data.length === 0 && (
        <EmptyState
          title="No other courses to join"
          hint="Courses appear here when a coordinator opens one to supervisor requests."
        />
      )}
    </div>
  );
}
