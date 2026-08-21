import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import { formatClock, useControlTimer, useSetSegmentTimeliness, useTimer } from '@/features/scheduling/useTimer';
import {
  useEvaluationConfig,
  type PanelScoreVisibility,
  type SavedCriterion,
} from '@/features/evaluations/useEvaluationConfig';
import { useSessionScores, useSubmitScores } from '@/features/scoring/useScoring';
import { useCpiPolicy } from '@/features/policy/usePolicy';
import { roleLabel, useJoinPanel, useSessionPanel, type PanelRole } from '@/features/panel/usePanel';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { Badge, Button, Card, EmptyState, Notice } from '@/components/ui';

// The presentation clock. It is kept on the server so every evaluator sees the
// same time. Parts never move on by themselves: going past a target turns the
// clock red and counts the extra time until someone presses Next.
function PresentationTimer({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const { data } = useTimer(cpiId, session.id, { refetchInterval: 2000 });
  const control = useControlTimer(cpiId, session.id);
  const setTimeliness = useSetSegmentTimeliness(cpiId, session.id);
  const [display, setDisplay] = useState(0);

  const current = data?.segments.find((seg) => seg.orderIndex === data.currentSegmentIndex) ?? null;
  const serverElapsed = current?.elapsedSeconds ?? data?.elapsedSeconds ?? 0;
  const running = data?.running ?? false;

  // Reset to the server value on each check, and count up in between so the clock
  // does not jump.
  useEffect(() => setDisplay(serverElapsed), [serverElapsed]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setDisplay((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const overrunning = !!current && display > current.targetSeconds;

  return (
    <div className="mt-3 rounded-control border border-line bg-canvas p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`font-mono text-lg tabular-nums ${overrunning ? 'text-critical-700' : 'text-ink'}`}
        >
          {formatClock(current ? current.targetSeconds - display : display)}
        </span>
        {current && <span className="text-xs text-ink-muted">{current.name}</span>}
        <span
          className={`rounded-control px-2 py-0.5 text-xs ${
            running ? 'bg-positive-50 text-positive-700' : 'bg-line text-ink-muted'
          }`}
        >
          {running ? 'running' : 'stopped'}
        </span>
        {overrunning && (
          <Badge tone="critical">
            over by {formatClock(display - (current?.targetSeconds ?? 0))}
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!running ? (
          <Button variant="success" size="sm"
            onClick={() => control.mutate('start')}
            disabled={control.isPending}>
            {display > 0 ? 'Resume' : 'Start'}
          </Button>
        ) : (
          <Button variant="caution" size="sm"
            onClick={() => control.mutate('pause')}
            disabled={control.isPending}>
            Pause
          </Button>
        )}
        <button
          onClick={() => control.mutate('previous')}
          disabled={control.isPending || !data?.segments.length}
          className="rounded-control border border-line-strong px-3 py-1 text-xs text-ink-muted hover:bg-canvas disabled:opacity-50"
        >
          Previous
        </button>
        <Button variant="neutral" size="sm"
          onClick={() => control.mutate('next')}
          disabled={control.isPending || !data?.segments.length}>
          Next segment
        </Button>
        <Button variant="primary" size="sm"
          onClick={() => control.mutate('stop')}
          disabled={control.isPending}>
          Stop &amp; save
        </Button>
        <button
          onClick={() => control.mutate('reset')}
          disabled={control.isPending}
          className="rounded-control border border-line-strong px-3 py-1 text-xs text-ink-muted hover:bg-canvas disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={() => window.open(`/timer/${cpiId}/${session.id}`, '_blank', 'noopener,width=1280,height=800')}
          className="rounded-control border border-line-strong px-3 py-1 text-xs text-ink-muted hover:bg-canvas"
        >
          Open timer window
        </button>
      </div>

      {data && data.segments.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {data.segments.map((segment) => (
            <li key={segment.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={
                  segment.orderIndex === data.currentSegmentIndex ? 'font-medium text-ink' : 'text-ink-muted'
                }
              >
                {segment.name}
              </span>
              <span className="font-mono text-ink-muted">
                {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
              </span>
              {segment.overranSeconds > 0 && (
                <span className="text-critical-700">+{formatClock(segment.overranSeconds)}</span>
              )}
              {segment.completedAt && (
                <select
                  value={segment.timeliness ?? ''}
                  onChange={(e) =>
                    setTimeliness.mutate({
                      segmentId: segment.id,
                      timeliness: e.target.value as 'ON_TIME' | 'OVERTIME' | 'UNDER',
                    })
                  }
                  className="rounded-control border border-line-strong px-1 py-0.5 text-xs"
                >
                  <option value="ON_TIME">on time</option>
                  <option value="OVERTIME">overtime</option>
                  <option value="UNDER">under</option>
                </select>
              )}
              {segment.timelinessManual && <span className="text-ink-subtle">(set by hand)</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-ink-muted">
        {data?.presentationDurationSeconds != null
          ? `Saved presentation time: ${formatClock(data.presentationDurationSeconds)}`
          : data?.segments.length
            ? 'Segments never advance on their own — press Next when the group finishes.'
            : 'This stage has no segments configured; the clock runs as one.'}
      </p>
      {control.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(control.error)}</p>}
    </div>
  );
}

// An evaluation whose stage is open to all: at an FYP demo nobody is assigned,
// every lecturer is invited and whoever turns up marks. Seating yourself is the
// only way in, so this is shown to any lecturer holding no seat here.
function JoinOpenPanel({
  cpiId,
  sessionId,
  openRoles,
}: {
  cpiId: string;
  sessionId: string;
  openRoles: PanelRole[];
}) {
  const join = useJoinPanel(cpiId, sessionId);
  const [role, setRole] = useState<PanelRole>(openRoles[0]);

  return (
    <div className="mt-2 rounded-control border border-brand-200 bg-brand-50 px-3 py-2">
      <p className="text-xs font-medium text-brand-700">This evaluation is open to join.</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        You are not on this panel yet. Take a seat to mark; your marks count according to the seat you take.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {openRoles.length > 1 && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PanelRole)}
            aria-label="Seat to take"
            className="rounded-control border border-line-strong px-2 py-1 text-xs"
          >
            {openRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        )}
        <Button variant="primary" size="sm" onClick={() => join.mutate(role)} disabled={join.isPending}>
          {join.isPending ? '\u2026' : `Join as ${roleLabel(role)}`}
        </Button>
      </div>
      {join.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(join.error)}</p>}
    </div>
  );
}

function SessionScorer({
  cpiId,
  session,
  criteria,
  scoreVisibility,
}: {
  cpiId: string;
  session: EvaluationSession;
  criteria: SavedCriterion[];
  scoreVisibility: PanelScoreVisibility;
}) {
  const { data: ownScores } = useSessionScores(cpiId, session.id);
  const submit = useSubmitScores(cpiId, session.id);
  const { data: policy } = useCpiPolicy(cpiId);
  const { data: panel } = useSessionPanel(cpiId, session.id);
  // Scoring is only open while SCHEDULED (still collecting) or CORRECTION_REQUESTED
  // (reopened for this panelist). Once AWAITING_REVIEW or FINALIZED, the backend
  // rejects writes — mirror that here so inputs are disabled too.
  const myUserId = useAuthStore((st) => st.user?.id);
  // A seat is what makes scoring possible; without one the backend refuses the
  // write, so the form is held closed rather than failing on submit.
  const seated = !panel || panel.panelists.some((pl) => pl.user?.id === myUserId);
  const openRoles = panel?.rules.filter((r) => r.openToAll).map((r) => r.role) ?? [];
  const locked =
    !seated || (session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED');
  const commentRequired = policy?.requireOverallComment ?? true;
  const openVisibility = scoreVisibility !== 'ISOLATED';

  const members = session.group.members.map((m) => m.student);

  // One input per criterion, or per criterion and student when the criterion is
  // scored individually. The key carries both.
  const fieldKey = (criterionId: string, studentId?: string) => `${criterionId}|${studentId ?? ''}`;

  // Every box this panelist has to fill in.
  const fields = criteria.flatMap((c) =>
    c.level === 'INDIVIDUAL'
      ? members.map((student) => ({ criterion: c, student }))
      : [{ criterion: c, student: undefined as (typeof members)[number] | undefined }],
  );

  const [values, setValues] = useState<Record<string, { score: string; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');

  useEffect(() => {
    if (!ownScores) return;
    const next: Record<string, { score: string; comment: string }> = {};
    for (const field of fields) {
      const key = fieldKey(field.criterion.id, field.student?.id);
      const existing = ownScores.find(
        (s) => s.rubricCriterionId === field.criterion.id && (s.studentId ?? undefined) === field.student?.id,
      );
      next[key] = { score: existing ? String(existing.score) : '', comment: existing?.comment ?? '' };
    }
    setValues(next);
    // fields is rebuilt each render; the scores and criteria it derives from are
    // what actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownScores, criteria, session.group.members]);

  // Reload an overall comment already saved for this seat, so resubmitting does
  // not force the panelist to retype it.
  useEffect(() => {
    const mine = panel?.panelists.find((p) => p.evaluation);
    if (mine?.evaluation) setOverallComment(mine.evaluation.overallComment);
  }, [panel]);

  const setField = (key: string, field: 'score' | 'comment', v: string) =>
    setValues((prev) => ({ ...prev, [key]: { ...prev[key], [field]: v } }));

  const onSubmit = () => {
    const payload = fields
      .filter((f) => values[fieldKey(f.criterion.id, f.student?.id)]?.score !== '')
      .map((f) => {
        const value = values[fieldKey(f.criterion.id, f.student?.id)];
        return {
          criterionId: f.criterion.id,
          studentId: f.student?.id,
          score: Number(value.score),
          comment: value.comment || undefined,
        };
      });
    submit.mutate({ scores: payload, overallComment: overallComment.trim() || undefined });
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {session.group.name} · {session.stage.name}
        </p>
        <div className="flex items-center gap-2">
          {session.isOverdue && (
            <Badge tone="critical">overdue</Badge>
          )}
          <span className="rounded-control bg-canvas px-2 py-0.5 text-xs text-ink-muted">{session.status}</span>
        </div>
      </div>

      {(session.scheduledStart || session.location) && (
        <p className="mt-1 text-xs text-ink-muted">
          {session.scheduledStart && new Date(session.scheduledStart).toLocaleString()}
          {session.location && ` · ${session.location}`}
        </p>
      )}

      <PresentationTimer cpiId={cpiId} session={session} />

      {openVisibility && (
        <p className="mt-2 rounded-control bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This evaluation is open: everyone on the panel can see each other&rsquo;s marks.
        </p>
      )}

      {!seated && openRoles.length > 0 && (
        <JoinOpenPanel cpiId={cpiId} sessionId={session.id} openRoles={openRoles} />
      )}
      {!seated && openRoles.length === 0 && (
        <p className="mt-2 rounded-control bg-canvas px-3 py-2 text-xs text-ink-muted">
          You are not on this panel, so you cannot mark here. Ask the coordinator to seat you.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {fields.map((field) => {
          const key = fieldKey(field.criterion.id, field.student?.id);
          return (
            <div key={key} className="flex flex-wrap items-center gap-2">
              <span className="w-32 text-xs text-ink">
                {field.criterion.name}
                {field.student && (
                  <span className="block text-ink-subtle">
                    {field.student.user.fullName || field.student.studentId}
                  </span>
                )}
              </span>
              <input
                type="number"
                min={0}
                max={field.criterion.maxScore}
                value={values[key]?.score ?? ''}
                onChange={(e) => setField(key, 'score', e.target.value)}
                disabled={locked}
                placeholder={`0–${field.criterion.maxScore}`}
                className="w-20 rounded-control border border-line-strong px-2 py-1 text-xs disabled:bg-canvas"
              />
              <input
                value={values[key]?.comment ?? ''}
                onChange={(e) => setField(key, 'comment', e.target.value)}
                disabled={locked}
                placeholder="comment (optional)"
                className="flex-1 rounded-control border border-line-strong px-2 py-1 text-xs disabled:bg-canvas"
              />
            </div>
          );
        })}
        {criteria.some((c) => c.level === 'INDIVIDUAL') && members.length === 0 && (
          <p className="text-xs text-amber-700">
            This stage is scored per student, but the group has no accepted members.
          </p>
        )}
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-ink">
          Overall comment{commentRequired && <span className="text-critical-700"> *</span>}
        </label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={locked}
          rows={3}
          placeholder="Your overall assessment of this evaluation"
          className="mt-1 w-full rounded-control border border-line-strong px-2 py-1 text-xs disabled:bg-canvas"
        />
      </div>

      {locked && (
        <p className="mt-2 text-xs text-ink-muted">
          Scoring is closed for this session — it is awaiting or has completed review.
        </p>
      )}
      {submit.isError && (
        <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(submit.error)}</p>
      )}
      {submit.isSuccess && <p className="mt-2 text-xs text-positive-700">Scores submitted.</p>}

      {!locked && (
        <Button variant="primary" size="sm" className="mt-3"
          onClick={onSubmit}
          disabled={submit.isPending || (commentRequired && !overallComment.trim())}>
          {submit.isPending ? '…' : 'Submit scores'}
        </Button>
      )}
    </Card>
  );
}

export function LecturerSessionsPage() {
  const { cpiId = '' } = useParams();
  // Poll so the shared presentation timer stays in sync across evaluators.
  const { data: sessions, isLoading, isError, error } = useSessions(cpiId, { refetchInterval: 3000 });
  const { data: config } = useEvaluationConfig(cpiId);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading sessions…</p>;
  if (isError) {
    // Not an evaluator here (e.g. a supervisor who opened this tab) — inform,
    // don't alarm.
    if (getApiErrorStatus(error) === 403) {
      return (
        <EmptyState
          title="No evaluation sessions for you"
          hint="This tab is for panelists. A coordinator seats you on a session before you can mark."
        />
      );
    }
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load sessions')}
      </Notice>
    );
  }
  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions assigned to you"
        hint="Sessions appear once the coordinator has generated them and seated you on a panel."
      />
    );
  }

  const stageFor = (stageId: string) => config?.find((s) => s.id === stageId);

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionScorer
          key={session.id}
          cpiId={cpiId}
          session={session}
          criteria={stageFor(session.stage.id)?.criteria ?? []}
          scoreVisibility={stageFor(session.stage.id)?.panelScoreVisibility ?? 'ISOLATED'}
        />
      ))}
    </div>
  );
}
