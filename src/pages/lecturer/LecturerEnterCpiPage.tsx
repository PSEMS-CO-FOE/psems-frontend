import { useNavigate } from 'react-router-dom';
import {
  useMySupervisorInvites,
  useRespondSupervisorInvite,
} from '@/features/courses/useSupervisorInvites';
import { useLecturerCpis } from '@/features/courses/useCourses';
import { getApiErrorMessage } from '@/lib/apiError';

function SupervisorInvitesCard() {
  const { data: invites, isLoading, isError, error } = useMySupervisorInvites();
  const respond = useRespondSupervisorInvite();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700">Supervisor invitations</h2>
      <p className="mt-1 text-xs text-gray-500">
        CPIs where a coordinator invited you to supervise. Accept to become an active supervisor.
      </p>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading invitations…</p>}
      {isError && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {getApiErrorMessage(error, 'Could not load invitations')}
        </p>
      )}
      {invites && invites.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">No pending supervisor invitations.</p>
      )}

      <ul className="mt-3 space-y-2">
        {invites?.map((inv) => (
          <li
            key={inv.cpiId}
            className="flex flex-wrap items-center gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
          >
            <span className="text-gray-700">
              <span className="font-medium">{inv.courseInstance.name}</span>{' '}
              <span className="text-gray-400">
                ({inv.courseInstance.department} · {inv.courseInstance.academicYear})
              </span>
            </span>
            <span className="ml-auto flex gap-2">
              <button
                onClick={() => respond.mutate({ cpiId: inv.cpiId, decision: 'ACCEPT' })}
                disabled={respond.isPending}
                className="rounded bg-green-600 px-3 py-1 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => respond.mutate({ cpiId: inv.cpiId, decision: 'DECLINE' })}
                disabled={respond.isPending}
                className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Decline
              </button>
            </span>
          </li>
        ))}
      </ul>

      {respond.isError && (
        <p className="mt-2 text-xs text-red-600">
          {getApiErrorMessage(respond.error, 'Could not respond — invites can only be answered during the Supervisor Addition phase.')}
        </p>
      )}
    </div>
  );
}

function AssignedCpisCard() {
  const navigate = useNavigate();
  const { data: cpis, isLoading, isError, error } = useLecturerCpis();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700">Your courses</h2>
      <p className="mt-1 text-xs text-gray-500">
        Courses where you're an accepted supervisor, evaluator, or Head Judge.
      </p>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading your courses…</p>}
      {isError && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {getApiErrorMessage(error, 'Could not load your courses')}
        </p>
      )}
      {cpis && cpis.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">
          You're not assigned to any course yet. Accept a supervisor invitation above, or wait to be
          added as an evaluator.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {cpis?.map((cpi) => (
          <li key={cpi.id}>
            <button
              onClick={() => navigate(`/lecturer/cpi/${cpi.id}/sessions`)}
              className="flex w-full items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
            >
              <span>
                <span className="text-sm font-medium text-gray-800">{cpi.name}</span>
                <span className="block text-xs text-gray-400">
                  {cpi.department} · {cpi.academicYear} · {cpi.roles.join(', ')}
                </span>
              </span>
              <span className="text-xs text-gray-500">Open →</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LecturerEnterCpiPage() {
  return (
    <div className="space-y-4">
      <SupervisorInvitesCard />
      <AssignedCpisCard />
    </div>
  );
}
