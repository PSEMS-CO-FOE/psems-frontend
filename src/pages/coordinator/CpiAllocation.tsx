import { useState } from 'react';
import {
  useAllocationMap,
  useGenerateAllocations,
  useOverrideAllocation,
  useFinalizeAllocations,
} from '@/features/allocation/useAllocation';
import { getApiErrorMessage } from '@/lib/apiError';

export function CpiAllocation({ cpiId }: { cpiId: string }) {
  const { data, isLoading } = useAllocationMap(cpiId);
  const generate = useGenerateAllocations(cpiId);
  const override = useOverrideAllocation(cpiId);
  const finalize = useFinalizeAllocations(cpiId);

  const [overrideGroupId, setOverrideGroupId] = useState('');
  const [overrideIdeaId, setOverrideIdeaId] = useState('');

  const anyError = generate.error || override.error || finalize.error;

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
            {data.allocations.map((a) => (
              <li key={a.id} className="text-xs text-gray-700">
                {a.group.name} → {a.idea.title}
                {a.supervisor && ` · ${a.supervisor.user.email}`}
                <span className="text-gray-400"> · {a.source}</span>
              </li>
            ))}
            {data.allocations.length === 0 && (
              <li className="text-xs text-gray-500">No allocations yet.</li>
            )}
          </ul>

          {data.unmatchedGroups.length > 0 && (
            <p className="mt-2 text-xs text-yellow-700">
              Unmatched groups: {data.unmatchedGroups.map((g) => g.name).join(', ')}
            </p>
          )}
        </>
      )}

      {!data?.finalized && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-gray-600">Override a group's allocation</p>
          <div className="flex flex-wrap gap-2">
            <input
              value={overrideGroupId}
              onChange={(e) => setOverrideGroupId(e.target.value)}
              placeholder="group id"
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <input
              value={overrideIdeaId}
              onChange={(e) => setOverrideIdeaId(e.target.value)}
              placeholder="idea id"
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <button
              onClick={() =>
                override.mutate(
                  { groupId: overrideGroupId, ideaId: overrideIdeaId },
                  { onSuccess: () => { setOverrideGroupId(''); setOverrideIdeaId(''); } },
                )
              }
              disabled={!overrideGroupId || !overrideIdeaId || override.isPending}
              className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
            >
              Override
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
