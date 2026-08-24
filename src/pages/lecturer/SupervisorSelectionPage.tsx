import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSelectionState,
  useCoSupervisionInterest,
  useLecturerInterest,
  useMarkWilling,
  useWithdrawInterest,
  useRespondSelection,
} from '@/features/selection/useSelection';
import { useRequestIdeaRevision } from '@/features/ideas/useIdeas';
import type { SeekingIdea } from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, Notice } from '@/components/ui';

function SeekingIdeaRow({ cpiId, seeking }: { cpiId: string; seeking: SeekingIdea }) {
  const markWilling = useMarkWilling(cpiId);
  const requestRevision = useRequestIdeaRevision(cpiId);
  const [note, setNote] = useState('');

  return (
    <li className="rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink">
          <span className="font-medium">{seeking.idea.title}</span>
          {seeking.group && <span className="text-ink-subtle"> · {seeking.group.name}</span>}
        </span>
        <Button variant="primary" size="sm" className="ml-auto"
          onClick={() => markWilling.mutate(seeking.ideaId)}
          disabled={markWilling.isPending}>
          Mark willing
        </Button>
      </div>
      <div className="mt-1 flex gap-1">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ask the group to revise…"
          className="flex-1 rounded-control border border-line-strong px-2 py-0.5"
        />
        <Button variant="caution" size="sm"
          onClick={() => requestRevision.mutate({ ideaId: seeking.ideaId, note }, { onSuccess: () => setNote('') })}
          disabled={!note || requestRevision.isPending}>
          Request revision
        </Button>
      </div>
      {(markWilling.isError || requestRevision.isError) && (
        <p className="mt-1 text-critical-700">{getApiErrorMessage(markWilling.error || requestRevision.error)}</p>
      )}
    </li>
  );
}

// Supervisor side of EOI / Mutual Confirmation (Supervisor-Led mode): mark
// willingness on student ideas seeking a supervisor, and accept/decline the
// group selections addressed to you.
export function SupervisorSelectionPage() {
  const { cpiId = '' } = useParams();
  const { data, isLoading, isError, error } = useSelectionState(cpiId);
  const respond = useRespondSelection(cpiId);
  const withdraw = useWithdrawInterest(cpiId);
  const lecturerInterest = useLecturerInterest(cpiId);
  const coSupervision = useCoSupervisionInterest(cpiId);
  const [interestIdeaId, setInterestIdeaId] = useState('');

  if (isLoading) return <p className="text-sm text-ink-muted">Loading selection…</p>;
  if (isError) {
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load selection state')}
      </Notice>
    );
  }
  if (!data || data.role !== 'SUPERVISOR') {
    return (
      <EmptyState
        title="Not open to you right now"
        hint="This view is for an accepted supervisor of this course, while the project selection phase is open."
      />
    );
  }

  const liveInterest = data.interestInMyIdeas.filter((e) => !e.withdrawnAt);

  return (
    <div className="space-y-4">
      {/* Interest is the step before a selection, so it comes first. */}
      <Card>
        <h2 className="text-sm font-semibold text-ink">Groups interested in your ideas</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Registering interest is not a commitment on either side. A group has to make a formal
          selection before it reaches you to accept.
        </p>
        {liveInterest.length === 0 ? (
          <EmptyState
            density="compact"
            title="No interest yet"
            hint="Groups that register interest in one of your ideas appear here."
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {liveInterest.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
              >
                <span className="font-medium text-ink">{e.group?.name ?? 'A group'}</span>
                <span className="text-ink-subtle">is interested in</span>
                <span className="font-medium text-ink">{e.idea.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pending selections awaiting this supervisor's confirmation */}
      <Card>
        <h2 className="text-sm font-semibold text-ink">Selections awaiting your response</h2>
        {data.pendingSelections.length === 0 && (
          <EmptyState density="compact" title="Nothing waiting on you" hint="Groups that register interest in one of your ideas appear here to accept or decline." />
        )}
        <ul className="mt-2 space-y-2">
          {data.pendingSelections.map((sel) => (
            <li
              key={sel.id}
              className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
            >
              <span className="text-ink">
                <span className="font-medium">{sel.group.name}</span> chose{' '}
                <span className="font-medium">{sel.idea.title}</span>
              </span>
              <span className="ml-auto flex gap-2">
                <Button variant="success" size="sm"
                  onClick={() => respond.mutate({ selectionId: sel.id, decision: 'ACCEPT' })}
                  disabled={respond.isPending}>
                  Accept
                </Button>
                <Button variant="danger" size="sm"
                  onClick={() => respond.mutate({ selectionId: sel.id, decision: 'DECLINE' })}
                  disabled={respond.isPending}>
                  Decline
                </Button>
              </span>
            </li>
          ))}
        </ul>
        {respond.isError && (
          <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(respond.error)}</p>
        )}
      </Card>

      {/* Student ideas seeking a supervisor — mark willing */}
      <Card>
        <h2 className="text-sm font-semibold text-ink">Ideas seeking a supervisor</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Groups flagged these as needing a supervisor. Marking willing lets the group pick you.
        </p>
        {data.seekingIdeas.length === 0 && (
          <EmptyState density="compact" title="No ideas seeking a supervisor" hint="Student ideas without a supervisor appear here while the selection phase is open." />
        )}
        <ul className="mt-2 space-y-2">
          {data.seekingIdeas.map((s) => (
            <SeekingIdeaRow key={s.ideaId} cpiId={cpiId} seeking={s} />
          ))}
        </ul>

        {/* The mirror image of a group expressing interest: a lecturer says they
            would like to take on a group's idea, or to co-supervise it. */}
        <div className="mt-3 border-t pt-3">
          <p className="text-xs font-medium text-ink">Express your own interest</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <select
              value={interestIdeaId}
              onChange={(e) => setInterestIdeaId(e.target.value)}
              className="rounded-control border border-line-strong px-2 py-1 text-xs"
            >
              <option value="">Choose an idea…</option>
              {data.seekingIdeas.map((s) => (
                <option key={s.ideaId} value={s.ideaId}>
                  {s.idea.title}
                </option>
              ))}
            </select>
            <Button variant="neutral" size="sm"
              onClick={() => lecturerInterest.mutate(interestIdeaId)}
              disabled={!interestIdeaId || lecturerInterest.isPending}>
              I'm interested
            </Button>
            <Button
              onClick={() => coSupervision.mutate(interestIdeaId)}
              disabled={!interestIdeaId || coSupervision.isPending}
              variant="secondary"
              size="sm"
            >
              Offer to co-supervise
            </Button>
          </div>
          {(lecturerInterest.isError || coSupervision.isError) && (
            <p className="mt-1 text-xs text-critical-700">
              {getApiErrorMessage(lecturerInterest.error || coSupervision.error)}
            </p>
          )}
        </div>
      </Card>

      {/* Ideas already marked willing, now withdrawable while the phase is open */}
      {data.willingByMe.filter((w) => !w.withdrawnAt).length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-ink">You marked willing on</h2>
          <ul className="mt-2 space-y-1">
            {data.willingByMe
              .filter((w) => !w.withdrawnAt)
              .map((w) => (
                <li key={w.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>{w.idea.title}</span>
                  <button
                    onClick={() => withdraw.mutate({ ideaId: w.idea.id, type: w.type })}
                    disabled={withdraw.isPending}
                    className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60 disabled:opacity-50"
                  >
                    withdraw
                  </button>
                </li>
              ))}
          </ul>
          {withdraw.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(withdraw.error)}</p>}
        </Card>
      )}
    </div>
  );
}
