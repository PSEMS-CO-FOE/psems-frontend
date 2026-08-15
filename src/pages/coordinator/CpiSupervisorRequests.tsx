import {
  useDecideSupervisorRequest,
  useSupervisorRequests,
} from '@/features/courses/useSupervisorRequests';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

// Lecturers who found this course themselves and asked to join. Approving sends
// them an invitation — they still have to accept it.
export function CpiSupervisorRequests({ cpiId }: { cpiId: string }) {
  const { data, isLoading } = useSupervisorRequests(cpiId);
  const decide = useDecideSupervisorRequest(cpiId);

  const pending = data?.filter((r) => r.status === 'PENDING') ?? [];
  const settled = data?.filter((r) => r.status !== 'PENDING') ?? [];

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Requests to supervise</h3>
      <p className="mt-1 text-xs text-gray-500">
        Approving creates a supervisor invitation, which the lecturer then accepts.
      </p>

      {isLoading && <p className="mt-2 text-xs text-gray-500">Loading…</p>}
      {decide.isError && <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(decide.error)}</p>}

      {pending.length === 0 && !isLoading && (
        <p className="mt-2 text-xs text-gray-500">No pending requests.</p>
      )}

      <ul className="mt-2 space-y-2">
        {pending.map((r) => (
          <li key={r.id} className="rounded border border-gray-200 p-2">
            <p className="text-xs font-medium text-gray-800">{personName(r.lecturer.user)}</p>
            {r.note && <p className="mt-0.5 text-xs text-gray-600">{r.note}</p>}
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => decide.mutate({ requestId: r.id, decision: 'APPROVE' })}
                disabled={decide.isPending}
                className="rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => decide.mutate({ requestId: r.id, decision: 'REJECT' })}
                disabled={decide.isPending}
                className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>

      {settled.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {settled.map((r) => (
            <li key={r.id} className="text-xs text-gray-400">
              {personName(r.lecturer.user)} — {r.status.toLowerCase()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
