import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import { useEvaluationConfig, type SavedCriterion } from '@/features/evaluations/useEvaluationConfig';
import { useSessionScores, useSubmitScores } from '@/features/scoring/useScoring';
import { getApiErrorMessage } from '@/lib/apiError';

function SessionScorer({
  cpiId,
  session,
  criteria,
}: {
  cpiId: string;
  session: EvaluationSession;
  criteria: SavedCriterion[];
}) {
  const { data: ownScores } = useSessionScores(cpiId, session.id);
  const submit = useSubmitScores(cpiId, session.id);
  const locked = session.status === 'FINALIZED';

  // Local form state: criterionId -> { score, comment }.
  const [values, setValues] = useState<Record<string, { score: string; comment: string }>>({});

  useEffect(() => {
    if (!ownScores) return;
    const next: Record<string, { score: string; comment: string }> = {};
    for (const c of criteria) {
      const existing = ownScores.find((s) => s.rubricCriterionId === c.id);
      next[c.id] = {
        score: existing ? String(existing.score) : '',
        comment: existing?.comment ?? '',
      };
    }
    setValues(next);
  }, [ownScores, criteria]);

  const setField = (cid: string, field: 'score' | 'comment', v: string) =>
    setValues((prev) => ({ ...prev, [cid]: { ...prev[cid], [field]: v } }));

  const onSubmit = () => {
    const payload = criteria
      .filter((c) => values[c.id]?.score !== '')
      .map((c) => ({
        criterionId: c.id,
        score: Number(values[c.id].score),
        comment: values[c.id].comment || undefined,
      }));
    submit.mutate(payload);
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </p>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{session.status}</span>
      </div>

      <div className="mt-2 space-y-2">
        {criteria.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <span className="w-32 text-xs text-gray-700">{c.name}</span>
            <input
              type="number"
              min={0}
              max={c.maxScore}
              value={values[c.id]?.score ?? ''}
              onChange={(e) => setField(c.id, 'score', e.target.value)}
              disabled={locked}
              placeholder={`0–${c.maxScore}`}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
            />
            <input
              value={values[c.id]?.comment ?? ''}
              onChange={(e) => setField(c.id, 'comment', e.target.value)}
              disabled={locked}
              placeholder="comment (optional)"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
            />
          </div>
        ))}
      </div>

      {submit.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(submit.error)}</p>
      )}
      {submit.isSuccess && <p className="mt-2 text-xs text-green-600">Scores submitted.</p>}

      {!locked && (
        <button
          onClick={onSubmit}
          disabled={submit.isPending}
          className="mt-3 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submit.isPending ? '…' : 'Submit scores'}
        </button>
      )}
    </div>
  );
}

export function LecturerSessionsPage() {
  const { cpiId = '' } = useParams();
  const { data: sessions, isLoading, isError, error } = useSessions(cpiId);
  const { data: config } = useEvaluationConfig(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading sessions…</p>;
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load sessions')}
      </p>
    );
  }
  if (!sessions || sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        No sessions assigned to you.
      </p>
    );
  }

  const criteriaFor = (stageId: string) =>
    config?.find((s) => s.id === stageId)?.criteria ?? [];

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionScorer
          key={session.id}
          cpiId={cpiId}
          session={session}
          criteria={criteriaFor(session.stage.id)}
        />
      ))}
    </div>
  );
}
