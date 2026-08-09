import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGuestWorkspace, useSubmitGuestScores, type GuestSession } from '@/features/panel/useGuest';
import { getApiErrorMessage } from '@/lib/apiError';

function GuestSessionCard({ token, session }: { token: string; session: GuestSession }) {
  const submit = useSubmitGuestScores(token);
  const [values, setValues] = useState<Record<string, { score: string; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');

  useEffect(() => {
    const next: Record<string, { score: string; comment: string }> = {};
    for (const c of session.criteria) {
      const existing = session.ownScores.find((s) => s.rubricCriterionId === c.id && !s.studentId);
      next[c.id] = { score: existing ? String(existing.score) : '', comment: existing?.comment ?? '' };
    }
    setValues(next);
    setOverallComment(session.overallComment ?? '');
  }, [session]);

  const setField = (cid: string, field: 'score' | 'comment', v: string) =>
    setValues((prev) => ({ ...prev, [cid]: { ...prev[cid], [field]: v } }));

  const locked = session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED';

  const onSubmit = () =>
    submit.mutate({
      sessionId: session.sessionId,
      scores: session.criteria
        .filter((c) => values[c.id]?.score !== '')
        .map((c) => ({
          criterionId: c.id,
          score: Number(values[c.id].score),
          comment: values[c.id].comment || undefined,
        })),
      overallComment: overallComment.trim() || undefined,
    });

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </p>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{session.status}</span>
      </div>
      {session.scheduledStart && (
        <p className="mt-1 text-xs text-gray-500">
          {new Date(session.scheduledStart).toLocaleString()}
          {session.location && ` · ${session.location}`}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {session.criteria.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <span className="w-40 text-xs text-gray-700" title={c.description ?? undefined}>
              {c.name}
            </span>
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

      <div className="mt-3">
        <label className="text-xs font-medium text-gray-700">
          Overall comment <span className="text-red-600">*</span>
        </label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={locked}
          rows={3}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
        />
      </div>

      {submit.isError && <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(submit.error)}</p>}
      {submit.isSuccess && <p className="mt-2 text-xs text-green-600">Marks submitted. Thank you.</p>}

      {!locked && (
        <button
          onClick={onSubmit}
          disabled={submit.isPending}
          className="mt-3 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submit.isPending ? '…' : 'Submit marks'}
        </button>
      )}
    </div>
  );
}

// A guest scores from their link alone — no account, no password, and nothing
// visible beyond the sessions the link names.
export function GuestScoringPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { data, isLoading, isError, error } = useGuestWorkspace(token);

  if (!token) {
    return <p className="p-6 text-sm text-gray-600">This page needs the scoring link you were sent.</p>;
  }
  if (isLoading) return <p className="p-6 text-sm text-gray-500">Loading…</p>;
  if (isError) {
    return (
      <p className="m-6 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
        {getApiErrorMessage(error, 'This scoring link is not valid')}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{data!.courseInstance.name}</h1>
        <p className="text-sm text-gray-600">
          Welcome, {data!.guest.fullName}
          {data!.guest.organization && ` · ${data!.guest.organization}`}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          This link works until {new Date(data!.expiresAt).toLocaleDateString()} and covers only the evaluations below.
        </p>
      </div>

      {data!.sessions.length === 0 && (
        <p className="text-sm text-gray-500">You have not been added to any evaluations yet.</p>
      )}
      {data!.sessions.map((s) => (
        <GuestSessionCard key={s.sessionId} token={token} session={s} />
      ))}
    </div>
  );
}
