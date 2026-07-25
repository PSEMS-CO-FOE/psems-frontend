import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIdeas } from '@/features/ideas/useIdeas';
import {
  useSelectionState,
  useSelectProject,
  useExpressInterest,
  useSeekingSupervisor,
} from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

export function SelectionPage() {
  const { cpiId = '' } = useParams();
  const { data: state, isLoading, isError, error } = useSelectionState(cpiId);
  const { data: ideas } = useIdeas(cpiId);

  const select = useSelectProject(cpiId);
  const interest = useExpressInterest(cpiId);
  const seeking = useSeekingSupervisor(cpiId);

  const [ideaId, setIdeaId] = useState('');
  const [supervisorUserId, setSupervisorUserId] = useState('');
  const [rank, setRank] = useState(1);

  if (isLoading) return <p className="text-sm text-gray-500">Loading selection…</p>;
  if (isError || !state) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load selection')}
      </p>
    );
  }
  if (state.role !== 'STUDENT') {
    return <p className="text-sm text-gray-500">Selection view is for students here.</p>;
  }

  const ideaOptions = ideas ?? [];

  return (
    <div className="space-y-4">
      {/* Current selection */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Your group's selection</h2>
        {state.selection ? (
          <p className="mt-2 text-sm text-gray-700">
            {state.selection.idea.title} —{' '}
            <span className="font-medium">{state.selection.status}</span>
            {state.selection.supervisor && ` · ${state.selection.supervisor.user.email}`}
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-500">No project selected yet.</p>
        )}
      </div>

      {/* Select a project */}
      {!state.selection && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">Select a project</h3>
          {select.isError && (
            <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(select.error)}</p>
          )}
          <select
            value={ideaId}
            onChange={(e) => setIdeaId(e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
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
              className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-xs"
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
          <button
            onClick={() =>
              select.mutate({ ideaId, supervisorUserId: supervisorUserId || undefined })
            }
            disabled={!ideaId || select.isPending}
            className="mt-2 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {select.isPending ? '…' : 'Select project'}
          </button>
        </div>
      )}

      {/* Supervisor-Led EOI actions */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Interest (Supervisor-Led){' '}
          <span className="font-normal text-gray-400">— ranked interest / seek a supervisor</span>
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={ideaId}
            onChange={(e) => setIdeaId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="">Choose an idea…</option>
            {ideaOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.authorType})
              </option>
            ))}
          </select>
          <select
            value={rank}
            onChange={(e) => setRank(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value={1}>rank 1</option>
            <option value={2}>rank 2</option>
            <option value={3}>rank 3</option>
          </select>
          <button
            onClick={() => interest.mutate({ ideaId, rank })}
            disabled={!ideaId || interest.isPending}
            className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            Express interest
          </button>
          <button
            onClick={() => seeking.mutate(ideaId)}
            disabled={!ideaId || seeking.isPending}
            className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            Seek supervisor (own idea)
          </button>
        </div>
        {(interest.isError || seeking.isError) && (
          <p className="mt-2 text-xs text-red-600">
            {getApiErrorMessage(interest.error || seeking.error)}
          </p>
        )}

        {state.groupInterest.length > 0 && (
          <ul className="mt-3 space-y-1">
            {state.groupInterest.map((e) => (
              <li key={e.id} className="text-xs text-gray-600">
                {e.type} — {e.idea.title}
                {e.rank ? ` (rank ${e.rank})` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
