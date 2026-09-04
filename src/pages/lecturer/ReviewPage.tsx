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
import { sessionStatusLabel } from '@/lib/labels';
import { Badge, Button, Card, EmptyState, Notice, SectionHeader, SkeletonText } from '@/components/ui';

// How long each part of the presentation actually took, so time management can be
// marked on real numbers. Loaded once when the card opens; nothing is running.
function SegmentLog({ cpiId, sessionId, open }: { cpiId: string; sessionId: string; open: boolean }) {
  const { data } = useTimer(cpiId, sessionId, { enabled: open, refetchInterval: 0 });
  if (!data || data.segments.length === 0) return null;

  return (
    <div className="mb-2 rounded-control border border-line bg-canvas-sunken p-2">
      <p className="text-xs font-medium text-ink-muted">Presentation timing</p>
      <ul className="mt-1 space-y-0.5">
        {data.segments.map((segment) => (
          <li key={segment.id} className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>{segment.name}</span>
            <span className="font-mono">
              {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
            </span>
            {segment.overranSeconds > 0 && (
              <span className="text-critical-700">over by {formatClock(segment.overranSeconds)}</span>
            )}
            {segment.timeliness && (
              <span className="text-ink-subtle">
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
    <Card>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-sm font-medium text-ink">
          {session.group.name} · {session.stage.name}
        </span>
        <Badge tone="neutral">{sessionStatusLabel(session.status)}</Badge>
      </button>

      {open && (
        <div className="mt-3">
          {session.presentationDurationSeconds != null && (
            <p className="mb-2 text-xs text-ink-muted">
              Presentation time:{' '}
              <span className="font-mono">{formatClock(session.presentationDurationSeconds)}</span>
            </p>
          )}
          <SegmentLog cpiId={cpiId} sessionId={session.id} open={open} />
          {isLoading && <p className="text-xs text-ink-muted">Loading review…</p>}
          {isError && (
            <Notice tone="critical" size="xs">
              {getApiErrorMessage(error, 'Review is only visible to this session’s reviewer')}
            </Notice>
          )}

          {review && (
            <>
              {review.criteria.length === 0 && <EmptyState density="compact" title="No scores submitted yet" hint="Panelists’ scores stay hidden from each other until every one of them has finished." />}
              {review.criteria.map((c) => (
                <div key={`${c.criterionId}-${c.student?.id ?? 'group'}`} className="mb-2 border-b pb-2">
                  <p className="text-xs font-medium text-ink">
                    {c.name}
                    {c.student && (
                      <span className="ml-1 rounded-control bg-info-50 px-1 text-info-700">
                        {c.student.user.fullName ?? c.student.studentId}
                      </span>
                    )}{' '}
                    <span className="text-ink-subtle">
                      (mean {c.mean.toFixed(1)}/{c.maxScore}, spread {c.spread})
                    </span>
                    {c.flagged && <Badge tone="critical" className="ml-1">deviation</Badge>}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {c.scores.map((s) => (
                      <li key={s.panelistId} className="text-xs text-ink-muted">
                        {s.name}
                        {s.affiliation && <span className="text-ink-subtle"> ({s.affiliation})</span>}{' '}
                        <span className="text-ink-subtle">· {roleLabel(s.role)}</span>: {s.score} (dev {s.deviation})
                        {s.comment && ` — ${s.comment}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* The mandatory end-of-evaluation comments, read alongside the numbers. */}
              {review.overallComments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-ink">Overall comments</p>
                  <ul className="mt-1 space-y-1">
                    {review.overallComments.map((oc) => (
                      <li key={oc.panelistId} className="rounded-control bg-canvas-sunken px-2 py-1 text-xs text-ink">
                        <span className="font-medium">{oc.name}</span>{' '}
                        <span className="text-ink-subtle">· {roleLabel(oc.role)}</span>
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
                  className={`mb-2 rounded-control px-2 py-1 text-xs ${
                    review.readiness.allRequirementsMet ? 'bg-positive-50 text-positive-700' : 'bg-caution-50 text-caution-700'
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
                  <Button variant="primary" size="sm"
                    onClick={() => closeScoring.mutate()}
                    disabled={session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED'}>
                    {closeScoring.isPending ? '…' : 'Close scoring'}
                  </Button>
                  <Button variant="success" size="sm"
                    onClick={() => approve.mutate()}
                    disabled={session.status !== 'AWAITING_REVIEW' || approve.isPending}>
                    {approve.isPending ? '…' : 'Approve & finalize'}
                  </Button>
                  {session.status !== 'SCHEDULED' && (
                    <Button
                      onClick={() => {
                        const why = window.prompt('Why are you reopening this evaluation?');
                        if (why?.trim()) reopen.mutate(why.trim());
                      }}
                      disabled={reopen.isPending}
                      variant="secondary"
                      size="sm"
                      title="Puts marking back in play. Refused once marks have been aggregated."
                    >
                      Reopen
                    </Button>
                  )}
                  {closeScoring.isError && (
                    <span className="text-xs text-critical-700">{getApiErrorMessage(closeScoring.error)}</span>
                  )}
                  {approve.isError && <span className="text-xs text-critical-700">{getApiErrorMessage(approve.error)}</span>}
                  {reopen.isError && <span className="text-xs text-critical-700">{getApiErrorMessage(reopen.error)}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <select
                    value={panelistId}
                    onChange={(e) => setPanelistId(e.target.value)}
                    className="rounded-control border border-line-strong px-2 py-1 text-xs"
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
                    className="flex-1 rounded-control border border-line-strong px-2 py-1 text-xs"
                  />
                  <Button variant="caution" size="sm"
                    onClick={() => correction.mutate({ panelistId, reason })}
                    disabled={!panelistId || !reason || correction.isPending}>
                    Request correction
                  </Button>
                </div>
                {correction.isError && (
                  <span className="text-xs text-critical-700">{getApiErrorMessage(correction.error)}</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export function ReviewPage() {
  const { cpiId = '' } = useParams();
  const { data: sessions, isLoading } = useSessions(cpiId);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Review"
        description="Expand a session to review the whole panel’s scores. Whoever reviews is set by the course: the Head Judge when one is enabled, otherwise the coordinator."
      />
      {isLoading && <SkeletonText />}
      {sessions?.map((s) => (
        <SessionReviewCard key={s.id} cpiId={cpiId} session={s} />
      ))}
      {sessions && sessions.length === 0 && <EmptyState title="No sessions to review" hint="A session reaches you once its panel has finished scoring." />}
    </div>
  );
}
