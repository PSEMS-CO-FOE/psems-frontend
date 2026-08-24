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
import { Button, Card, EmptyState, Notice, Select } from '@/components/ui';
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

      {/* One idea picker, not two. The page had a "Select a project" card and an
          "Interest" card, each with its own dropdown over the same ideas — and
          both bound to the same state, so they always showed the same value. */}
      {!state.selection && (
        <Card
          title="Choose a project"
          description="Register interest first if you want to signal to a supervisor. Selecting is the formal step, and it needs confirming before it is yours."
        >
          <div className="space-y-3">
            <Select
              label="Idea"
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
            >
              <option value="">Choose an idea…</option>
              {ideaOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} ({i.authorType})
                </option>
              ))}
            </Select>

            {/* Only when selecting your OWN idea: pick from supervisors who
                marked willing on it. */}
            {state.willingSupervisors.length > 0 && (
              <Select
                label="Willing supervisor"
                hint="Only needed when the idea is your group's own."
                value={supervisorUserId}
                onChange={(e) => setSupervisorUserId(e.target.value)}
              >
                <option value="">Choose a willing supervisor…</option>
                {state.willingSupervisors
                  .filter((w) => w.supervisor)
                  .map((w) => (
                    <option key={w.id} value={w.supervisor!.user.id}>
                      {personName(w.supervisor!.user)} — {w.idea.title}
                    </option>
                  ))}
              </Select>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button
                variant="secondary"
                onClick={() => interest.mutate(ideaId)}
                disabled={!ideaId || interest.isPending}
              >
                Register interest
              </Button>
              <Button
                variant="secondary"
                onClick={() => seeking.mutate(ideaId)}
                disabled={!ideaId || seeking.isPending}
              >
                Seek a supervisor for our idea
              </Button>
              <Button
                variant="primary"
                className="ml-auto"
                onClick={() =>
                  select.mutate({ ideaId, supervisorUserId: supervisorUserId || undefined })
                }
                disabled={!ideaId || select.isPending}
              >
                {select.isPending ? 'Selecting…' : 'Select this project'}
              </Button>
            </div>

            {(select.isError || interest.isError || seeking.isError) && (
              <Notice tone="critical" size="xs">
                {getApiErrorMessage(select.error || interest.error || seeking.error)}
              </Notice>
            )}
          </div>
        </Card>
      )}

      {/* Interest already registered. Shown even after a selection exists, since
          it is a record of what the group did. */}
      {state.groupInterest.filter((e) => !e.withdrawnAt).length > 0 && (
        <Card title="Interest your group registered">
          <ul className="space-y-2">
            {state.groupInterest
              .filter((e) => !e.withdrawnAt)
              .map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
                >
                  <span className="text-ink-muted">
                    {e.type === 'SEEKING_SUPERVISOR' ? 'Seeking a supervisor for' : 'Interested in'}
                  </span>
                  <span className="font-medium text-ink">{e.idea.title}</span>
                  {/* Withdrawing frees a slot against the course's interest cap. */}
                  {!state.selection && (
                    <Button
                      variant="danger-quiet"
                      size="sm"
                      className="ml-auto"
                      onClick={() => withdraw.mutate({ ideaId: e.idea.id, type: e.type })}
                      disabled={withdraw.isPending}
                    >
                      Withdraw
                    </Button>
                  )}
                </li>
              ))}
          </ul>
          {withdraw.isError && (
            <Notice tone="critical" size="xs" className="mt-2">
              {getApiErrorMessage(withdraw.error)}
            </Notice>
          )}
        </Card>
      )}

    </div>
  );
}
