import { useNavigate } from 'react-router-dom';
import {
  useMySupervisorInvites,
  useRespondSupervisorInvite,
} from '@/features/courses/useSupervisorInvites';
import { useLecturerCpis } from '@/features/courses/useCourses';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, Notice, PageHeader } from '@/components/ui';

function SupervisorInvitesCard() {
  const { data: invites, isLoading, isError, error } = useMySupervisorInvites();
  const respond = useRespondSupervisorInvite();

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Supervisor invitations</h2>
      <p className="mt-1 text-xs text-ink-muted">
        CPIs where a coordinator invited you to supervise. Accept to become an active supervisor.
      </p>

      {isLoading && <p className="mt-3 text-xs text-ink-muted">Loading invitations…</p>}
      {isError && (
        <Notice tone="critical" size="xs" className="mt-3">
          {getApiErrorMessage(error, 'Could not load invitations')}
        </Notice>
      )}
      {invites && invites.length === 0 && (
        <EmptyState density="compact" title="No pending invitations" hint="A coordinator invites you to a course, or you can ask to join one from Find courses." />
      )}

      <ul className="mt-3 space-y-2">
        {invites?.map((inv) => (
          <li
            key={inv.cpiId}
            className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
          >
            <span className="text-ink">
              <span className="font-medium">{inv.courseInstance.name}</span>{' '}
              <span className="text-ink-subtle">
                ({inv.courseInstance.department} · {inv.courseInstance.academicYear})
              </span>
            </span>
            <span className="ml-auto flex gap-2">
              <Button variant="success" size="sm"
                onClick={() => respond.mutate({ cpiId: inv.cpiId, decision: 'ACCEPT' })}
                disabled={respond.isPending}>
                Accept
              </Button>
              <Button variant="danger" size="sm"
                onClick={() => respond.mutate({ cpiId: inv.cpiId, decision: 'DECLINE' })}
                disabled={respond.isPending}>
                Decline
              </Button>
            </span>
          </li>
        ))}
      </ul>

      {respond.isError && (
        <p className="mt-2 text-xs text-critical-700">
          {getApiErrorMessage(respond.error, 'Could not respond — invites can only be answered during the Supervisor Addition phase.')}
        </p>
      )}
    </Card>
  );
}

function AssignedCpisCard() {
  const navigate = useNavigate();
  const { data: cpis, isLoading, isError, error } = useLecturerCpis();

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Your courses</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Courses where you're an accepted supervisor, evaluator, or Head Judge.
      </p>

      {isLoading && <p className="mt-3 text-xs text-ink-muted">Loading your courses…</p>}
      {isError && (
        <Notice tone="critical" size="xs" className="mt-3">
          {getApiErrorMessage(error, 'Could not load your courses')}
        </Notice>
      )}
      {cpis && cpis.length === 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          You're not assigned to any course yet. Accept a supervisor invitation above, or wait to be
          added as an evaluator.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {cpis?.map((cpi) => (
          <li key={cpi.id}>
            <button
              onClick={() => navigate(`/lecturer/cpi/${cpi.id}/sessions`)}
              className="flex w-full items-center justify-between rounded-control border border-line bg-canvas-sunken px-3 py-2 text-left hover:bg-brand-50"
            >
              <span>
                <span className="text-sm font-medium text-ink">{cpi.name}</span>
                <span className="block text-xs text-ink-subtle">
                  {cpi.department} · {cpi.academicYear} · {cpi.roles.join(', ')}
                </span>
              </span>
              <span className="text-xs text-ink-muted">Open →</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function LecturerEnterCpiPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        eyebrow="Supervisor & evaluator"
        description="Courses you supervise or evaluate on, and any invitations waiting on you."
      />
      <SupervisorInvitesCard />
      <AssignedCpisCard />
    </div>
  );
}
