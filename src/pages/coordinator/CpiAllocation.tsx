import { useState } from 'react';
import {
  useAllocationMap,
  useGenerateAllocations,
  useOverrideAllocation,
  useFinalizeAllocations,
  useConfirmAllocation,
} from '@/features/allocation/useAllocation';
import type { CpiMode } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

export function CpiAllocation({ cpiId, mode }: { cpiId: string; mode: CpiMode }) {
  const { data, isLoading } = useAllocationMap(cpiId);
  const generate = useGenerateAllocations(cpiId);
  const override = useOverrideAllocation(cpiId);
  const finalize = useFinalizeAllocations(cpiId);
  const confirm = useConfirmAllocation(cpiId);

  const [overrideGroupId, setOverrideGroupId] = useState('');
  const [overrideIdeaId, setOverrideIdeaId] = useState('');
  const [overrideSupervisorUserId, setOverrideSupervisorUserId] = useState('');

  // Coordinator-Managed requires each pairing be reviewed (confirmed/reassigned)
  // before finalize — Supervisor-Led carries mutual selection confirmation.
  const isCoordinatorManaged = mode === 'COORDINATOR_MANAGED';

  const anyError = generate.error || override.error || finalize.error || confirm.error;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Allocation</h3>
        {data?.finalized && (
          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Finalized</span>
        )}
      </div>

      {anyError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(anyError)}</p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => generate.mutate(undefined)}
          disabled={data?.finalized || generate.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {generate.isPending ? '…' : 'Generate from selections'}
        </button>
        <button
          onClick={() => finalize.mutate(undefined)}
          disabled={data?.finalized || finalize.isPending}
          className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
        >
          {finalize.isPending ? '…' : 'Finalize (lock)'}
        </button>
      </div>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading…</p>}

      {data && (
        <>
          <ul className="mt-3 space-y-1">
            {data.allocations.map((a) => {
              const reviewed = a.source === 'COORDINATOR_OVERRIDE';
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                  <span>
                    {a.group.name} → {a.idea.title}
                    {a.supervisor && ` · ${a.supervisor.user.email}`}
                    <span className="text-gray-400"> · {a.source}</span>
                  </span>
                  {/* Coordinator-Managed per-pairing review (spec Step 7). */}
                  {isCoordinatorManaged && !data.finalized && (
                    reviewed ? (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">reviewed</span>
                    ) : (
                      <button
                        onClick={() => confirm.mutate(a.group.id)}
                        disabled={confirm.isPending}
                        className="rounded bg-gray-700 px-2 py-0.5 font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                      >
                        Confirm pairing
                      </button>
                    )
                  )}
                </li>
              );
            })}
            {data.allocations.length === 0 && (
              <li className="text-xs text-gray-500">No allocations yet.</li>
            )}
          </ul>

          {isCoordinatorManaged && !data.finalized && data.allocations.some((a) => a.source === 'FROM_SELECTION') && (
            <p className="mt-2 text-xs text-gray-500">
              Confirm or reassign every pairing before you can finalize.
            </p>
          )}

          {data.unmatchedGroups.length > 0 && (
            <p className="mt-2 text-xs text-yellow-700">
              Unmatched groups: {data.unmatchedGroups.map((g) => g.name).join(', ')}
            </p>
          )}

          {data.unmatchedSupervisorIdeas.length > 0 && (
            <p className="mt-1 text-xs text-yellow-700">
              Unallocated supervisor ideas:{' '}
              {data.unmatchedSupervisorIdeas.map((i) => i.title).join(', ')}
            </p>
          )}
        </>
      )}

      {data && !data.finalized && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-gray-600">
            {isCoordinatorManaged ? 'Assign / reassign a group' : "Override a group's allocation"}
          </p>
          <div className="flex flex-wrap gap-2">
            <select
              value={overrideGroupId}
              onChange={(e) => setOverrideGroupId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
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
              className="rounded border border-gray-300 px-2 py-1 text-xs"
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
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="">No supervisor</option>
              {data.supervisors.map((s) => (
                <option key={s.userId} value={s.userId}>
                  {personName(s)}
                </option>
              ))}
            </select>
            <button
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
              disabled={!overrideGroupId || !overrideIdeaId || override.isPending}
              className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
            >
              {isCoordinatorManaged ? 'Assign' : 'Override'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
