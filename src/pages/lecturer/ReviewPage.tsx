import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import {
  useSessionReview,
  useApproveSession,
  useCloseScoring,
  useReopenSession,
  useRequestCorrection,
} from '@/features/review/useReview';
import { roleLabel } from '@/features/panel/usePanel';
import { formatClock, useTimer } from '@/features/scheduling/useTimer';
import { getApiErrorMessage } from '@/lib/apiError';

// How long each part of the presentation actually took, so time management can be
// marked on real numbers. Loaded once when the card opens; nothing is running.
function SegmentLog({ cpiId, sessionId, open }: { cpiId: string; sessionId: string; open: boolean }) {
  const { data } = useTimer(cpiId, sessionId, { enabled: open, refetchInterval: 0 });
  if (!data || data.segments.length === 0) return null;

  return (
    <div className="mb-2 rounded border border-gray-200 bg-gray-50 p-2">
      <p className="text-xs font-medium text-gray-600">Presentation timing</p>
      <ul className="mt-1 space-y-0.5">
        {data.segments.map((segment) => (
          <li key={segment.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span>{segment.name}</span>
            <span className="font-mono">
              {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
            </span>
            {segment.overranSeconds > 0 && (
              <span className="text-red-600">over by {formatClock(segment.overranSeconds)}</span>
            )}
            {segment.timeliness && (
              <span className="text-gray-400">
                {segment.timeliness.toLowerCase().replace('_', ' ')}
                {segment.timelinessManual && ' (set by hand)'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionReviewCard({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const [open, setOpen] = useState(false);
  const { data: review, isLoading, isError, error } = useSessionReview(cpiId, session.id, open);
  const approve = useApproveSession(cpiId, session.id);
  const closeScoring = useCloseScoring(cpiId, session.id);
  const reopen = useReopenSession(cpiId, session.id);
  const correction = useRequestCorrection(cpiId, session.id);
  const [panelistId, setPanelistId] = useState('');
  const [reason, setReason] = useState('');

  // Distinct panel seats that scored this session, for the correction picker.
  // Keyed by seat rather than user so a guest with no account can be asked too.
  const scorers = review
    ? Array.from(
        new Map(
          review.criteria.flatMap((c) =>
            c.scores.map((s) => [s.panelistId, { id: s.panelistId, name: s.name, role: s.role }] as const),
          ),
        ).values(),
      )
    : [];

  return (
    <div className="rounded-lg border bg-white p-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{session.status}</span>
      </button>

      {open && (
        <div className="mt-3">
          {session.presentationDurationSeconds != null && (
            <p className="mb-2 text-xs text-gray-600">
              Presentation time:{' '}
              <span className="font-mono">{formatClock(session.presentationDurationSeconds)}</span>
            </p>
          )}
          <SegmentLog cpiId={cpiId} sessionId={session.id} open={open} />
          {isLoading && <p className="text-xs text-gray-500">Loading review…</p>}
          {isError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">
              {getApiErrorMessage(error, 'Review is only visible to this session’s reviewer')}
            </p>
          )}

          {review && (
            <>
              {review.criteria.length === 0 && <p className="text-xs text-gray-500">No scores submitted yet.</p>}
              {review.criteria.map((c) => (
                <div key={`${c.criterionId}-${c.student?.id ?? 'group'}`} className="mb-2 border-b pb-2">
                  <p className="text-xs font-medium text-gray-700">
                    {c.name}
                    {c.student && (
                      <span className="ml-1 rounded bg-blue-50 px-1 text-blue-700">
                        {c.student.user.fullName ?? c.student.studentId}
                      </span>
                    )}{' '}
                    <span className="text-gray-400">
                      (mean {c.mean.toFixed(1)}/{c.maxScore}, spread {c.spread})
                    </span>
                    {c.flagged && <span className="ml-1 rounded bg-red-100 px-1 text-red-700">deviation</span>}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {c.scores.map((s) => (
                      <li key={s.panelistId} className="text-xs text-gray-600">
                        {s.name}
                        {s.affiliation && <span className="text-gray-400"> ({s.affiliation})</span>}{' '}
                        <span className="text-gray-400">· {roleLabel(s.role)}</span>: {s.score} (dev {s.deviation})
                        {s.comment && ` — ${s.comment}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* The mandatory end-of-evaluation comments, read alongside the numbers. */}
              {review.overallComments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700">Overall comments</p>
                  <ul className="mt-1 space-y-1">
                    {review.overallComments.map((oc) => (
                      <li key={oc.panelistId} className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">
                        <span className="font-medium">{oc.name}</span>{' '}
                        <span className="text-gray-400">· {roleLabel(oc.role)}</span>
                        <br />
                        {oc.comment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Readiness is information, not a gate — nothing advances on its
                  own, so the reviewer decides when marking is over. */}
              {review.readiness && review.readiness.roles.length > 0 && (
                <p
                  className={`mb-2 rounded px-2 py-1 text-xs ${
                    review.readiness.allRequirementsMet ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {review.readiness.roles
                    .map((r) => `${roleLabel(r.role)}: ${r.finished}/${r.minRequired}`)
                    .join(' · ')}
                  {!review.readiness.allRequirementsMet && ' — you can still close, but this stage asked for more.'}
                </p>
              )}

              <div className="mt-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => closeScoring.mutate()}
                    disabled={session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED'}
                    className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {closeScoring.isPending ? '…' : 'Close scoring'}
                  </button>
                  <button
                    onClick={() => approve.mutate()}
                    disabled={session.status !== 'AWAITING_REVIEW' || approve.isPending}
                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {approve.isPending ? '…' : 'Approve & finalize'}
                  </button>
                  {session.status !== 'SCHEDULED' && (
                    <button
                      onClick={() => {
                        const why = window.prompt('Why are you reopening this evaluation?');
                        if (why?.trim()) reopen.mutate(why.trim());
                      }}
                      disabled={reopen.isPending}
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      title="Puts marking back in play. Refused once marks have been aggregated."
                    >
                      Reopen
                    </button>
                  )}
                  {closeScoring.isError && (
                    <span className="text-xs text-red-600">{getApiErrorMessage(closeScoring.error)}</span>
                  )}
                  {approve.isError && <span className="text-xs text-red-600">{getApiErrorMessage(approve.error)}</span>}
                  {reopen.isError && <span className="text-xs text-red-600">{getApiErrorMessage(reopen.error)}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <select
                    value={panelistId}
                    onChange={(e) => setPanelistId(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="">Select panelist…</option>
                    {scorers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {roleLabel(s.role)}
                      </option>
                    ))}
                  </select>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="reason"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => correction.mutate({ panelistId, reason })}
                    disabled={!panelistId || !reason || correction.isPending}
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
        Expand a session to review the whole panel’s scores. Whoever reviews is set by the course: the Head Judge when
        one is enabled, otherwise the coordinator.
      </p>
      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {sessions?.map((s) => (
        <SessionReviewCard key={s.id} cpiId={cpiId} session={s} />
      ))}
      {sessions && sessions.length === 0 && <p className="text-sm text-gray-500">No sessions.</p>}
    </div>
  );
}
