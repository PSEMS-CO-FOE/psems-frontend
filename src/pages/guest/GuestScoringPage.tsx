import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGuestWorkspace, useSubmitGuestScores, type GuestSession } from '@/features/panel/useGuest';
import { getApiErrorMessage } from '@/lib/apiError';
import { Avatar, Badge, Button, Card, EmptyState, Notice, SkeletonCard } from '@/components/ui';
import { SiteFooter } from '@/components/layout/SiteFooter';
import crest from '@/assets/crest.png';

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
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            {session.stage.name}
          </p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-ink">
            {session.group.name}
          </p>
        </div>
        <Badge tone={locked ? 'neutral' : 'brand'} dot>
          {session.status.toLowerCase().replace(/_/g, ' ')}
        </Badge>
      </div>
      {session.scheduledStart && (
        <p className="mt-1 text-xs text-ink-muted">
          {new Date(session.scheduledStart).toLocaleString()}
          {session.location && ` · ${session.location}`}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {session.criteria.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-2 rounded-control bg-canvas-sunken p-2"
          >
            <span
              className="w-40 shrink-0 text-xs font-medium text-ink"
              title={c.description ?? undefined}
            >
              {c.name}
              <span className="ml-1 font-normal text-ink-subtle">/ {c.maxScore}</span>
            </span>
            <input
              type="number"
              min={0}
              max={c.maxScore}
              value={values[c.id]?.score ?? ''}
              onChange={(e) => setField(c.id, 'score', e.target.value)}
              disabled={locked}
              placeholder={`0–${c.maxScore}`}
              aria-label={`Score for ${c.name}`}
              className="h-9 w-20 px-2.5 text-xs"
            />
            <input
              value={values[c.id]?.comment ?? ''}
              onChange={(e) => setField(c.id, 'comment', e.target.value)}
              disabled={locked}
              placeholder="Comment (optional)"
              aria-label={`Comment on ${c.name}`}
              className="h-9 min-w-40 flex-1 px-2.5 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor={`overall-${session.sessionId}`} className="text-xs font-medium text-ink">
          Overall comment <span className="text-critical-700">*</span>
        </label>
        <textarea
          id={`overall-${session.sessionId}`}
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={locked}
          rows={3}
          className="mt-1.5 w-full px-3 py-2 text-xs"
        />
      </div>

      {submit.isError && (
        <Notice tone="critical" size="xs" className="mt-3">
          {getApiErrorMessage(submit.error)}
        </Notice>
      )}
      {submit.isSuccess && (
        <Notice tone="positive" size="xs" className="mt-3">
          Marks submitted. Thank you.
        </Notice>
      )}

      {!locked && (
        <Button variant="primary" className="mt-4" onClick={onSubmit} disabled={submit.isPending}>
          {submit.isPending ? 'Submitting…' : 'Submit marks'}
        </Button>
      )}
    </Card>
  );
}

// A guest scores from their link alone — no account, no password, and nothing
// visible beyond the sessions the link names.
export function GuestScoringPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { data, isLoading, isError, error } = useGuestWorkspace(token);

  // Every state of this screen sits inside the same frame. A guest holds no
  // account and will see PSEMS exactly once, so a bare sentence on a white page
  // gives them nothing to tell a working link from a broken one.
  const body = () => {
    if (!token) {
      return (
        <Notice tone="caution">This page needs the scoring link you were sent.</Notice>
      );
    }
    if (isLoading) return <SkeletonCard rows={3} />;
    if (isError) {
      return (
        <Notice tone="critical">
          {getApiErrorMessage(error, 'This scoring link is not valid')}
        </Notice>
      );
    }
    if (!data) return null;

    return (
      <>
        <Card accent>
          <div className="flex items-start gap-3">
            <Avatar name={data.guest.fullName} tone="guest" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-brand-700">
                Guest evaluator
              </p>
              <h1 className="mt-1.5 text-title font-semibold text-ink">
                {data.courseInstance.name}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Welcome, {data.guest.fullName}
                {data.guest.organization && ` · ${data.guest.organization}`}
              </p>
            </div>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-xs text-ink-subtle">
            This link works until {new Date(data.expiresAt).toLocaleDateString()} and covers only
            the evaluations below.
          </p>
        </Card>

        {data.sessions.length === 0 ? (
          <EmptyState
            title="No evaluations yet"
            hint="You have not been added to any. The coordinator will let you know when there is something to mark."
          />
        ) : (
          data.sessions.map((s) => <GuestSessionCard key={s.sessionId} token={token} session={s} />)
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line surface-glass">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-6">
          <img
            src={crest}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg bg-brand-50 object-contain p-1 ring-1 ring-brand-200"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-ink">PSEMS</span>
            <span className="block truncate text-[11px] text-ink-subtle">
              Faculty of Engineering — USJ
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-6 pb-[calc(var(--footer-h)+2rem)] pt-8">
        {body()}
      </main>

      <SiteFooter />
    </div>
  );
}
