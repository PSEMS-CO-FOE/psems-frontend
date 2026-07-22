import { useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useMarks } from '@/features/marks/useMarks';
import { getApiErrorMessage } from '@/lib/apiError';

export function MarksPage() {
  const { cpiId = '' } = useParams();
  const { data: marks, isLoading, isError, error } = useMarks(cpiId, { treat403AsEmpty: true });

  // Pre-publish 403 is an expected state, not an error.
  const notPublished = error instanceof AxiosError && error.response?.status === 403;

  if (isLoading) return <p className="text-sm text-gray-500">Loading marks…</p>;
  if (notPublished) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        Your marks haven't been published yet.
      </p>
    );
  }
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load marks')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {marks?.map((g) => (
        <div key={g.groupId} className="rounded-lg border bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">
            {g.groupName} — overall {g.overall}
          </p>
          <ul className="mt-2 space-y-1">
            {g.stages.map((s) => (
              <li key={s.stageId} className="text-xs text-gray-600">
                {s.stageName}: {s.stageScorePercent}% (stage weight {s.weight}%) → contributes{' '}
                {s.weightedContribution}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {marks && marks.length === 0 && (
        <p className="text-sm text-gray-500">No marks available.</p>
      )}
    </div>
  );
}
