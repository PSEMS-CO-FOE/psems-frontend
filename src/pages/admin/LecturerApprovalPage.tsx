import { usePendingLecturers, useLecturerDecision } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';

export function LecturerApprovalPage() {
  const { data: lecturers, isLoading, isError, error } = usePendingLecturers();
  const decision = useLecturerDecision();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading pending lecturers…</p>;
  }

  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load pending lecturers')}
      </p>
    );
  }

  if (!lecturers || lecturers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No lecturers awaiting approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">
        {lecturers.length} lecturer{lecturers.length === 1 ? '' : 's'} awaiting approval
      </h2>

      {decision.isError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(decision.error, 'Action failed')}
        </p>
      )}

      <ul className="divide-y rounded-lg border bg-white">
        {lecturers.map((lecturer) => {
          const isThisRowPending =
            decision.isPending && decision.variables?.lecturerId === lecturer.id;
          return (
            <li key={lecturer.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {lecturer.user.fullName ?? '(no name)'}
                </p>
                <p className="text-xs text-gray-500">{lecturer.user.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'approve' })
                  }
                  className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'reject' })
                  }
                  className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
