import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIdeas } from '@/features/ideas/useIdeas';
import {
  useSelectionState,
  useSelectProject,
  useExpressInterest,
  useSeekingSupervisor,
  useWithdrawInterest,
} from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Button, Card, EmptyState, Notice } from '@/components/ui';
import { PolicyNote } from '@/components/PolicyNote';

export function SelectionPage() {
  const { cpiId = '' } = useParams();
  const { data: state, isLoading, isError, error } = useSelectionState(cpiId);
  const { data: ideas } = useIdeas(cpiId);

  const select = useSelectProject(cpiId);
  const interest = useExpressInterest(cpiId);
  const seeking = useSeekingSupervisor(cpiId);
  const withdraw = useWithdrawInterest(cpiId);

  const [ideaId, setIdeaId] = useState('');
  const [supervisorUserId, setSupervisorUserId] = useState('');

  if (isLoading) return <p className="text-sm text-ink-muted">Loading selection…</p>;
  if (isError || !state) {
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load selection')}
      </Notice>
    );
  }
  if (state.role !== 'STUDENT') {
    return <p className="text-sm text-ink-muted">Selection view is for students here.</p>;
  }

  const ideaOptions = ideas ?? [];

  const CONFIRMER = {
    SUPERVISOR: 'the supervisor you choose',
    COORDINATOR: 'the coordinator',
    EITHER: 'either the coordinator or the supervisor you choose',
  };

  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.interestEnabled
            ? 'Express interest first — a project is not yours until it is confirmed.'
            : 'Interest is not used here; a project is assigned directly.',
          `A selection is confirmed by ${CONFIRMER[p.selectionConfirmedBy]}.`,
          p.interestEnabled &&
            (p.allowInterestWithdrawal
              ? 'You may withdraw interest while this phase is open.'
              : 'Interest cannot be withdrawn once you express it.'),
          p.maxInterestsPerGroup !== null &&
            `Your group may express at most ${p.maxInterestsPerGroup} interest(s).`,
        ]}
      />
      {/* Current selection */}
      <Card>
        <h2 className="text-sm font-semibold text-ink">Your group's selection</h2>
        {state.selection ? (
          <p className="mt-2 text-sm text-ink">
            {state.selection.idea.title} —{' '}
            <span className="font-medium">{state.selection.status}</span>
            {state.selection.supervisor && ` · ${state.selection.supervisor.user.email}`}
          </p>
        ) : (
          <EmptyState density="compact" title="No project selected yet" hint="Register interest in a supervisor’s idea, or post your own, while the selection phase is open." />
        )}
      </Card>

      {/* Select a project */}
      {!state.selection && (
        <Card title="Select a project">
          {select.isError && (
            <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(select.error)}</p>
          )}
          <select
            value={ideaId}
            onChange={(e) => setIdeaId(e.target.value)}
            className="mt-2 w-full rounded-control border border-line-strong px-2 py-1 text-sm"
          >
            <option value="">Choose an idea…</option>
            {ideaOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.authorType})
              </option>
            ))}
          </select>
          {/* Only needed when selecting your OWN idea in Supervisor-Led mode:
              pick from supervisors who marked willing on it. */}
          {state.willingSupervisors.length > 0 && (
            <select
              value={supervisorUserId}
              onChange={(e) => setSupervisorUserId(e.target.value)}
              className="mt-2 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            >
              <option value="">Choose a willing supervisor (for your own idea)…</option>
              {state.willingSupervisors
                .filter((w) => w.supervisor)
                .map((w) => (
                  <option key={w.id} value={w.supervisor!.user.id}>
                    {personName(w.supervisor!.user)} — {w.idea.title}
                  </option>
                ))}
            </select>
          )}
          <Button variant="primary" className="mt-2"
            onClick={() =>
              select.mutate({ ideaId, supervisorUserId: supervisorUserId || undefined })
            }
            disabled={!ideaId || select.isPending}>
            {select.isPending ? '…' : 'Select project'}
          </Button>
        </Card>
      )}

      {/* Supervisor-Led EOI actions */}
      <Card>
        <h3 className="text-sm font-semibold text-ink">
          Interest (Supervisor-Led){' '}
          <span className="font-normal text-ink-subtle">— express interest / seek a supervisor</span>
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={ideaId}
            onChange={(e) => setIdeaId(e.target.value)}
            className="rounded-control border border-line-strong px-2 py-1 text-xs"
          >
            <option value="">Choose an idea…</option>
            {ideaOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.authorType})
              </option>
            ))}
          </select>
          <Button variant="neutral" size="sm"
            onClick={() => interest.mutate(ideaId)}
            disabled={!ideaId || interest.isPending}>
            Express interest
          </Button>
          <Button variant="neutral" size="sm"
            onClick={() => seeking.mutate(ideaId)}
            disabled={!ideaId || seeking.isPending}>
            Seek supervisor (own idea)
          </Button>
        </div>
        {(interest.isError || seeking.isError) && (
          <p className="mt-2 text-xs text-critical-700">
            {getApiErrorMessage(interest.error || seeking.error)}
          </p>
        )}

        {state.groupInterest.length > 0 && (
          <ul className="mt-3 space-y-1">
            {state.groupInterest.filter((e) => !e.withdrawnAt).map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-xs text-ink-muted">
                <span>
                  {e.type === 'SEEKING_SUPERVISOR' ? 'Seeking a supervisor for' : 'Interested in'} — {e.idea.title}
                </span>
                {/* Withdrawing frees a slot against the course's interest cap. */}
                <button
                  onClick={() => withdraw.mutate({ ideaId: e.idea.id, type: e.type })}
                  disabled={withdraw.isPending}
                  className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60 disabled:opacity-50"
                >
                  withdraw
                </button>
              </li>
            ))}
          </ul>
        )}
        {withdraw.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(withdraw.error)}</p>}
      </Card>
    </div>
  );
}
