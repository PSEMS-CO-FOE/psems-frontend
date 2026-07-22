import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import {
  useSessionReview,
  useApproveSession,
  useRequestCorrection,
} from '@/features/headjudge/useHeadJudge';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

function SessionReviewCard({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const [open, setOpen] = useState(false);
  const { data: review, isLoading, isError, error } = useSessionReview(cpiId, session.id, open);
  const approve = useApproveSession(cpiId, session.id);
  const correction = useRequestCorrection(cpiId, session.id);
  const [evaluatorUserId, setEvaluatorUserId] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="rounded-lg border bg-white p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{session.status}</span>
      </button>

      {open && (
        <div className="mt-3">
          {isLoading && <p className="text-xs text-gray-500">Loading review…</p>}
          {isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
              {getApiErrorMessage(error, 'Review unavailable (Head Judge only)')}
            </p>
          )}

          {review && (
            <>
              {review.criteria.length === 0 && (
                <p className="text-xs text-gray-500">No scores submitted yet.</p>
              )}
              {review.criteria.map((c) => (
                <div key={c.criterionId} className="mb-2 border-b pb-2">
                  <p className="text-xs font-medium text-gray-700">
                    {c.name}{' '}
                    <span className="text-gray-400">
                      (mean {c.mean.toFixed(1)}/{c.maxScore}, spread {c.spread})
                    </span>
                    {c.flagged && (
                      <span className="ml-1 rounded bg-red-100 px-1 text-red-700">deviation</span>
                    )}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {c.scores.map((s, i) => (
                      <li key={i} className="text-xs text-gray-600">
                        {personName(s.evaluator)}: {s.score} (dev {s.deviation})
                        {s.comment && ` — ${s.comment}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Actions */}
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approve.mutate()}
                    disabled={session.status !== 'AWAITING_HEAD_JUDGE' || approve.isPending}
                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {approve.isPending ? '…' : 'Approve & finalize'}
                  </button>
                  {approve.isError && (
                    <span className="text-xs text-red-600">{getApiErrorMessage(approve.error)}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <input
                    value={evaluatorUserId}
                    onChange={(e) => setEvaluatorUserId(e.target.value)}
                    placeholder="evaluator userId"
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="reason"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => correction.mutate({ evaluatorUserId, reason })}
                    disabled={!evaluatorUserId || !reason || correction.isPending}
                    className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Request correction
                  </button>
                </div>
                {correction.isError && (
                  <span className="text-xs text-red-600">{getApiErrorMessage(correction.error)}</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewPage() {
  const { cpiId = '' } = useParams();
  const { data: sessions, isLoading } = useSessions(cpiId);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Head Judge only. Expand a session to review all evaluators' scores.
      </p>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {sessions?.map((s) => (
        <SessionReviewCard key={s.id} cpiId={cpiId} session={s} />
      ))}
      {sessions && sessions.length === 0 && (
        <p className="text-sm text-gray-500">No sessions.</p>
      )}
    </div>
  );
}
