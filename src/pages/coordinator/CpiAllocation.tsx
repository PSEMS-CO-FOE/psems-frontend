import { useState } from 'react';
import {
  useAllocationMap,
  useGenerateAllocations,
  useOverrideAllocation,
  useFinalizeAllocations,
  useReopenAllocations,
  useConfirmAllocation,
} from '@/features/allocation/useAllocation';
import type { CpiMode } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Button, Card, EmptyState, SkeletonText } from '@/components/ui';

export function CpiAllocation({ cpiId, mode }: { cpiId: string; mode: CpiMode }) {
  const { data, isLoading } = useAllocationMap(cpiId);
  const generate = useGenerateAllocations(cpiId);
  const override = useOverrideAllocation(cpiId);
  const finalize = useFinalizeAllocations(cpiId);
  const reopen = useReopenAllocations(cpiId);
  const confirm = useConfirmAllocation(cpiId);

  const [overrideGroupId, setOverrideGroupId] = useState('');
  const [overrideIdeaId, setOverrideIdeaId] = useState('');
  const [overrideSupervisorUserId, setOverrideSupervisorUserId] = useState('');

  // Coordinator-Managed requires each pairing be reviewed (confirmed/reassigned)
  // before finalize — Supervisor-Led carries mutual selection confirmation.
  const isCoordinatorManaged = mode === 'COORDINATOR_MANAGED';

  const anyError = generate.error || override.error || finalize.error || confirm.error || reopen.error;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-ink">Allocation</h2>
        {data?.finalized && (
          <span className="rounded-control bg-line px-2 py-0.5 text-xs text-ink-muted">Finalized</span>
        )}
      </div>

      {anyError && (
        <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(anyError)}</p>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="primary" size="sm"
          onClick={() => generate.mutate(undefined)}
          disabled={data?.finalized || generate.isPending}>
          {generate.isPending ? '…' : 'Generate from selections'}
        </Button>
        <Button variant="neutral" size="sm"
          onClick={() => finalize.mutate(undefined)}
          disabled={data?.finalized || finalize.isPending}>
          {finalize.isPending ? '…' : 'Finalize (lock)'}
        </Button>
        {/* A supervisor going on leave mid-semester is ordinary; before this the
            lock had no way out and the pairing simply could not be changed. */}
        {data?.finalized && (
          <Button variant="neutral" size="sm"
            onClick={() => {
              const why = window.prompt('Why are you reopening allocations?');
              if (why?.trim()) reopen.mutate(why.trim());
            }}
            disabled={reopen.isPending}
            title="Unlocks pairings so a supervisor or idea can be changed. Refused once marks have been aggregated.">
            {reopen.isPending ? '…' : 'Reopen'}
          </Button>
        )}
      </div>

      {isLoading && <SkeletonText className="mt-3" />}

      {data && (
        <>
          <ul className="mt-3 space-y-1">
            {data.allocations.map((a) => {
              const reviewed = a.source === 'COORDINATOR_OVERRIDE';
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-ink">
                  <span>
                    {a.group.name} → {a.idea.title}
                    {a.supervisor && ` · ${a.supervisor.user.email}`}
                    <span className="text-ink-subtle"> · {a.source}</span>
                  </span>
                  {/* Coordinator-Managed per-pairing review (spec Step 7). */}
                  {isCoordinatorManaged && !data.finalized && (
                    reviewed ? (
                      <span className="rounded-control bg-positive-50 px-1.5 py-0.5 text-positive-700">reviewed</span>
                    ) : (
                      <Button variant="neutral" size="sm"
                        onClick={() => confirm.mutate(a.group.id)}
                        disabled={confirm.isPending}>
                        Confirm pairing
                      </Button>
                    )
                  )}
                </li>
              );
            })}
            {data.allocations.length === 0 && (
              <li><EmptyState density="compact" title="No allocations yet" hint="Allocations appear once supervisors and groups have confirmed each other." /></li>
            )}
          </ul>

          {isCoordinatorManaged && !data.finalized && data.allocations.some((a) => a.source === 'FROM_SELECTION') && (
            <p className="mt-2 text-xs text-ink-muted">
              Confirm or reassign every pairing before you can finalize.
            </p>
          )}

          {data.unmatchedGroups.length > 0 && (
            <p className="mt-2 text-xs text-caution-700">
              Unmatched groups: {data.unmatchedGroups.map((g) => g.name).join(', ')}
            </p>
          )}

          {data.unmatchedSupervisorIdeas.length > 0 && (
            <p className="mt-1 text-xs text-caution-700">
              Unallocated supervisor ideas:{' '}
              {data.unmatchedSupervisorIdeas.map((i) => i.title).join(', ')}
            </p>
          )}
        </>
      )}

      {data && !data.finalized && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-ink-muted">
            {isCoordinatorManaged ? 'Assign / reassign a group' : "Override a group's allocation"}
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value={overrideGroupId}
              onChange={(e) => setOverrideGroupId(e.target.value)}
              className="rounded-control border border-line-strong px-2 py-1 text-xs"
            >
              <option value="">Select group…</option>
              {/* Every group in the CPI — allocated ones (to reassign) and unmatched. */}
              {[...data.allocations.map((a) => a.group), ...data.unmatchedGroups]
                .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
            <select
              value={overrideIdeaId}
              onChange={(e) => setOverrideIdeaId(e.target.value)}
              className="rounded-control border border-line-strong px-2 py-1 text-xs"
            >
              <option value="">Select idea…</option>
              {data.ideas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title} ({i.authorType.toLowerCase()})
                </option>
              ))}
            </select>
            <select
              value={overrideSupervisorUserId}
              onChange={(e) => setOverrideSupervisorUserId(e.target.value)}
              className="rounded-control border border-line-strong px-2 py-1 text-xs"
            >
              <option value="">No supervisor</option>
              {data.supervisors.map((s) => (
                <option key={s.userId} value={s.userId}>
                  {personName(s)}
                </option>
              ))}
            </select>
            <Button variant="neutral" size="sm"
              onClick={() =>
                override.mutate(
                  {
                    groupId: overrideGroupId,
                    ideaId: overrideIdeaId,
                    supervisorUserId: overrideSupervisorUserId || undefined,
                  },
                  {
                    onSuccess: () => {
                      setOverrideGroupId('');
                      setOverrideIdeaId('');
                      setOverrideSupervisorUserId('');
                    },
                  },
                )
              }
              disabled={!overrideGroupId || !overrideIdeaId || override.isPending}>
              {isCoordinatorManaged ? 'Assign' : 'Override'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
