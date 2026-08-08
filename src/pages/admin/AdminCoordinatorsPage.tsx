import { useApprovedLecturers, useAssignCoordinator } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

// System Admin promotes an approved lecturer to Course Coordinator.
export function AdminCoordinatorsPage() {
  const { data: lecturers, isLoading, isError, error } = useApprovedLecturers();
  const assign = useAssignCoordinator();

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Promote a lecturer to Course Coordinator</h2>
      <p className="mt-1 text-xs text-gray-500">
        Approved lecturers who can be given the Course Coordinator role.
      </p>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading lecturers…</p>}
      {isError && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {getApiErrorMessage(error, 'Could not load lecturers')}
        </p>
      )}
      {lecturers && lecturers.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">No approved lecturers yet.</p>
      )}

      <ul className="mt-3 divide-y">
        {lecturers?.map((l) => (
          <li key={l.userId} className="flex items-center justify-between py-2 text-xs">
            <span className="text-gray-700">
              {personName(l)} <span className="text-gray-400">({l.email})</span>
            </span>
            <button
              onClick={() => assign.mutate(l.userId)}
              disabled={assign.isPending}
              className="rounded bg-gray-800 px-3 py-1 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Make coordinator
            </button>
          </li>
        ))}
      </ul>

      {assign.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(assign.error)}</p>
      )}
      {assign.isSuccess && (
        <p className="mt-2 text-xs text-green-600">Lecturer promoted to Course Coordinator.</p>
      )}
    </div>
  );
}
