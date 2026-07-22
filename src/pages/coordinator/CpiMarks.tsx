import { useMarks, useAggregateMarks, usePublishMarks } from '@/features/marks/useMarks';
import { getApiErrorMessage } from '@/lib/apiError';

export function CpiMarks({ cpiId }: { cpiId: string }) {
  const { data: marks } = useMarks(cpiId);
  const aggregate = useAggregateMarks(cpiId);
  const publish = usePublishMarks(cpiId);

  const anyError = aggregate.error || publish.error;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Marks</h3>

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => aggregate.mutate()}
          disabled={aggregate.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {aggregate.isPending ? '…' : 'Aggregate'}
        </button>
        <button
          onClick={() => publish.mutate()}
          disabled={publish.isPending}
          className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
        >
          {publish.isPending ? '…' : 'Publish'}
        </button>
        {publish.isSuccess && <span className="text-xs text-green-600">Published.</span>}
      </div>

      {anyError && <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(anyError)}</p>}

      <ul className="mt-3 space-y-2">
        {marks?.map((g) => (
          <li key={g.groupId} className="text-xs">
            <p className="font-medium text-gray-800">
              {g.groupName} — overall {g.overall}
            </p>
            <p className="text-gray-400">
              {g.stages.map((s) => `${s.stageName}: ${s.stageScorePercent}% (×${s.weight}%)`).join(' · ')}
            </p>
          </li>
        ))}
        {marks && marks.length === 0 && <li className="text-xs text-gray-500">No marks yet.</li>}
      </ul>
    </div>
  );
}
