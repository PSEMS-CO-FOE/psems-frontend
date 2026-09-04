import { useIdeas } from '@/features/ideas/useIdeas';
import {
  useAcceptInterestedGroup,
  useRespondSelection,
  useSelectionState,
} from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { selectionStatusLabel } from '@/lib/labels';
import { Badge, Button, Card, EmptyState, Notice } from '@/components/ui';

/**
 * Groups that asked for an idea the coordinator posted. Every idea is awarded by
 * whoever posted it — a supervisor picks from the groups interested in theirs,
 * and this is the same thing for the coordinator's own. Without it a
 * coordinator-posted idea was the one kind nobody could award.
 */
function InterestedGroups({ cpiId }: { cpiId: string }) {
  const { data: state } = useSelectionState(cpiId);
  const { data: ideas } = useIdeas(cpiId);
  const accept = useAcceptInterestedGroup(cpiId);

  if (!state || state.role !== 'COORDINATOR') return null;

  const mine = new Set(
    (ideas ?? []).filter((i) => i.authorType === 'COORDINATOR').map((i) => i.id),
  );
  const placed = new Set(
    state.selections.filter((s) => s.status !== 'DECLINED').map((s) => s.group.id),
  );

  const asking = state.interestExpressions.filter(
    (e) => e.type === 'GROUP_INTEREST' && !e.withdrawnAt && mine.has(e.idea.id) && e.group,
  );

  return (
    <Card
      title="Groups interested in your ideas"
      description="Ideas you posted yourself. Pick the group you want; that confirms the project for them straight away."
    >
      {asking.length === 0 ? (
        <EmptyState
          density="compact"
          title="Nobody has asked yet"
          hint="Groups register interest in ideas during the selection phase. Ideas a supervisor posted are awarded by that supervisor, not here."
        />
      ) : (
        <ul className="space-y-2">
          {asking.map((e) => {
            const taken = placed.has(e.group!.id);
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
              >
                <span className="font-medium text-ink">{e.group!.name}</span>
                <span className="text-ink-subtle">is interested in</span>
                <span className="font-medium text-ink">{e.idea.title}</span>
                {taken ? (
                  <Badge tone="neutral" className="ml-auto">
                    Already has a project
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => accept.mutate({ ideaId: e.idea.id, groupId: e.group!.id })}
                    disabled={accept.isPending}
                  >
                    Take this group
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {accept.isError && (
        <Notice tone="critical" size="xs" className="mt-2">
          {getApiErrorMessage(accept.error)}
        </Notice>
      )}
    </Card>
  );
}

export function CpiSelections({ cpiId }: { cpiId: string }) {
  const { data: state, isLoading } = useSelectionState(cpiId);
  const respond = useRespondSelection(cpiId);

  if (isLoading) return null;
  if (!state || state.role !== 'COORDINATOR') return null;

  return (
    <div className="space-y-5">
      <InterestedGroups cpiId={cpiId} />

    <Card title="Project selections">

      {state.selections.length === 0 ? (
        <EmptyState density="compact" title="No selections yet" hint="Groups register interest while the selection phase is open." />
      ) : (
        <ul className="mt-2 space-y-2">
          {state.selections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-ink">
                {s.group.name} → {s.idea.title}{' '}
                <span className="text-ink-subtle">· {selectionStatusLabel(s.status)}</span>
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
        <Notice tone="critical" size="xs" className="mt-2">
          {getApiErrorMessage(respond.error)}
        </Notice>
      )}
    </Card>
    </div>
  );
}
