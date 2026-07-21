import { useSelectionState, useRespondSelection } from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';

export function CpiSelections({ cpiId }: { cpiId: string }) {
  const { data: state, isLoading } = useSelectionState(cpiId);
  const respond = useRespondSelection(cpiId);

  if (isLoading) return null;
  if (!state || state.role !== 'COORDINATOR') return null;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Project selections</h3>
      {state.selections.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">No selections yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {state.selections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-700">
                {s.group.name} → {s.idea.title}{' '}
                <span className="text-gray-400">· {s.status}</span>
              </span>
              {s.status === 'PENDING' && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => respond.mutate({ selectionId: s.id, decision: 'ACCEPT' })}
                    disabled={respond.isPending}
                    className="rounded bg-green-600 px-2 py-0.5 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => respond.mutate({ selectionId: s.id, decision: 'DECLINE' })}
                    disabled={respond.isPending}
                    className="rounded bg-red-600 px-2 py-0.5 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {respond.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(respond.error)}</p>
      )}
    </div>
  );
}
