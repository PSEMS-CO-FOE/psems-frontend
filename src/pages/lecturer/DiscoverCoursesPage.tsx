import { useState } from 'react';
import { useOpenCourses, useRequestToSupervise, type OpenCourse } from '@/features/courses/useSupervisorRequests';
import { getApiErrorMessage } from '@/lib/apiError';

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
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800">{course.name}</p>
          <p className="text-xs text-gray-500">
            {course.department} · {course.academicYear} · {course.projectType}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Coordinated by {course.createdBy.fullName ?? course.createdBy.email} · {course._count.groups} group(s) ·{' '}
            {course._count.supervisors} supervisor(s)
          </p>
        </div>
        {course.requestStatus ? (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {STATUS_LABEL[course.requestStatus]}
          </span>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            Ask to supervise
          </button>
        )}
      </div>

      {open && !course.requestStatus && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Optional — a lecturer can simply ask. */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why you'd like to supervise (optional)"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            onClick={() => request.mutate({ cpiId: course.id, note: note.trim() || undefined })}
            disabled={request.isPending}
            className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {request.isPending ? '…' : 'Send request'}
          </button>
        </div>
      )}
      {request.isError && <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(request.error)}</p>}
    </div>
  );
}

// Courses a lecturer is not on yet. Deliberately shows course details only —
// never the ideas inside, since accepted supervisors can see groups' restricted
// ideas and a lecturer is not one yet.
export function DiscoverCoursesPage() {
  const { data, isLoading } = useOpenCourses();

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Courses you are not on. Asking to supervise sends a request to the coordinator; if they approve it, you get an
        invitation to accept.
      </p>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {data?.map((c) => <CourseCard key={c.id} course={c} />)}
      {data && data.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          No other courses to join.
        </p>
      )}
    </div>
  );
}
