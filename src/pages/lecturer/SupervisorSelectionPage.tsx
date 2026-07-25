import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSelectionState,
  useMarkWilling,
  useRespondSelection,
} from '@/features/selection/useSelection';
import { useRequestIdeaRevision } from '@/features/ideas/useIdeas';
import type { SeekingIdea } from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';

function SeekingIdeaRow({ cpiId, seeking }: { cpiId: string; seeking: SeekingIdea }) {
  const markWilling = useMarkWilling(cpiId);
  const requestRevision = useRequestIdeaRevision(cpiId);
  const [note, setNote] = useState('');

  return (
    <li className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-700">
          <span className="font-medium">{seeking.idea.title}</span>
          {seeking.group && <span className="text-gray-400"> · {seeking.group.name}</span>}
        </span>
        <button
          onClick={() => markWilling.mutate(seeking.ideaId)}
          disabled={markWilling.isPending}
          className="ml-auto rounded bg-gray-800 px-3 py-1 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Mark willing
        </button>
      </div>
      <div className="mt-1 flex gap-1">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ask the group to revise…"
          className="flex-1 rounded border border-gray-300 px-2 py-0.5"
        />
        <button
          onClick={() => requestRevision.mutate({ ideaId: seeking.ideaId, note }, { onSuccess: () => setNote('') })}
          disabled={!note || requestRevision.isPending}
          className="rounded bg-yellow-600 px-2 py-0.5 font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          Request revision
        </button>
      </div>
      {(markWilling.isError || requestRevision.isError) && (
        <p className="mt-1 text-red-600">{getApiErrorMessage(markWilling.error || requestRevision.error)}</p>
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

  if (isLoading) return <p className="text-sm text-gray-500">Loading selection…</p>;
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load selection state')}
      </p>
    );
  }
  if (!data || data.role !== 'SUPERVISOR') {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        The supervisor selection view is only available to an accepted supervisor of this CPI,
        during the Project Selection phase.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending selections awaiting this supervisor's confirmation */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Selections awaiting your response</h2>
        {data.pendingSelections.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">No selections are waiting on you.</p>
        )}
        <ul className="mt-2 space-y-2">
          {data.pendingSelections.map((sel) => (
            <li
              key={sel.id}
              className="flex flex-wrap items-center gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
            >
              <span className="text-gray-700">
                <span className="font-medium">{sel.group.name}</span> chose{' '}
                <span className="font-medium">{sel.idea.title}</span>
              </span>
              <span className="ml-auto flex gap-2">
                <button
                  onClick={() => respond.mutate({ selectionId: sel.id, decision: 'ACCEPT' })}
                  disabled={respond.isPending}
                  className="rounded bg-green-600 px-3 py-1 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond.mutate({ selectionId: sel.id, decision: 'DECLINE' })}
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
          <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(respond.error)}</p>
        )}
      </div>

      {/* Student ideas seeking a supervisor — mark willing */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Ideas seeking a supervisor</h2>
        <p className="mt-1 text-xs text-gray-500">
          Groups flagged these as needing a supervisor. Marking willing lets the group pick you.
        </p>
        {data.seekingIdeas.length === 0 && (
          <p className="mt-2 text-xs text-gray-500">No ideas are currently seeking a supervisor.</p>
        )}
        <ul className="mt-2 space-y-2">
          {data.seekingIdeas.map((s) => (
            <SeekingIdeaRow key={s.ideaId} cpiId={cpiId} seeking={s} />
          ))}
        </ul>
      </div>

      {/* Ideas already marked willing */}
      {data.willingByMe.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700">You marked willing on</h2>
          <ul className="mt-2 space-y-1">
            {data.willingByMe.map((w) => (
              <li key={w.id} className="text-xs text-gray-600">
                {w.idea.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
