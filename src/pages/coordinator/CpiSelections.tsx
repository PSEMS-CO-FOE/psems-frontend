import { useSelectionState, useRespondSelection } from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState } from '@/components/ui';

export function CpiSelections({ cpiId }: { cpiId: string }) {
  const { data: state, isLoading } = useSelectionState(cpiId);
  const respond = useRespondSelection(cpiId);

  if (isLoading) return null;
  if (!state || state.role !== 'COORDINATOR') return null;

  return (
    <Card title="Project selections">
      {state.selections.length === 0 ? (
        <EmptyState density="compact" title="No selections yet" hint="Groups register interest while the selection phase is open." />
      ) : (
        <ul className="mt-2 space-y-2">
          {state.selections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink">
                {s.group.name} → {s.idea.title}{' '}
                <span className="text-ink-subtle">· {s.status}</span>
              </span>
              {s.status === 'PENDING' && (
                <div className="flex shrink-0 gap-1">
                  <Button variant="success" size="sm"
                    onClick={() => respond.mutate({ selectionId: s.id, decision: 'ACCEPT' })}
                    disabled={respond.isPending}>
                    Confirm
                  </Button>
                  <Button variant="danger" size="sm"
                    onClick={() => respond.mutate({ selectionId: s.id, decision: 'DECLINE' })}
                    disabled={respond.isPending}>
                    Decline
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {respond.isError && (
        <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(respond.error)}</p>
      )}
    </Card>
  );
}
