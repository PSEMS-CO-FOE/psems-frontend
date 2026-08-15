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
import { useSessionPanel } from '@/features/panel/usePanel';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';

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
    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`font-mono text-lg tabular-nums ${overrunning ? 'text-red-600' : 'text-gray-800'}`}
        >
          {formatClock(current ? current.targetSeconds - display : display)}
        </span>
        {current && <span className="text-xs text-gray-600">{current.name}</span>}
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            running ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {running ? 'running' : 'stopped'}
        </span>
        {overrunning && (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
            over by {formatClock(display - (current?.targetSeconds ?? 0))}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!running ? (
          <button
            onClick={() => control.mutate('start')}
            disabled={control.isPending}
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {display > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={() => control.mutate('pause')}
            disabled={control.isPending}
            className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            Pause
          </button>
        )}
        <button
          onClick={() => control.mutate('previous')}
          disabled={control.isPending || !data?.segments.length}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => control.mutate('next')}
          disabled={control.isPending || !data?.segments.length}
          className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
        >
          Next segment
        </button>
        <button
          onClick={() => control.mutate('stop')}
          disabled={control.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Stop &amp; save
        </button>
        <button
          onClick={() => control.mutate('reset')}
          disabled={control.isPending}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={() => window.open(`/timer/${cpiId}/${session.id}`, '_blank', 'noopener,width=1280,height=800')}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
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
                  segment.orderIndex === data.currentSegmentIndex ? 'font-medium text-gray-800' : 'text-gray-500'
                }
              >
                {segment.name}
              </span>
              <span className="font-mono text-gray-500">
                {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
              </span>
              {segment.overranSeconds > 0 && (
                <span className="text-red-600">+{formatClock(segment.overranSeconds)}</span>
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
                  className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                >
                  <option value="ON_TIME">on time</option>
                  <option value="OVERTIME">overtime</option>
                  <option value="UNDER">under</option>
                </select>
              )}
              {segment.timelinessManual && <span className="text-gray-400">(set by hand)</span>}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-gray-500">
        {data?.presentationDurationSeconds != null
          ? `Saved presentation time: ${formatClock(data.presentationDurationSeconds)}`
          : data?.segments.length
            ? 'Segments never advance on their own — press Next when the group finishes.'
            : 'This stage has no segments configured; the clock runs as one.'}
      </p>
      {control.isError && <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(control.error)}</p>}
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
  const locked = session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED';
  const commentRequired = policy?.requireOverallComment ?? true;
  const openVisibility = scoreVisibility !== 'ISOLATED';

  // Local form state: criterionId -> { score, comment }.
  const [values, setValues] = useState<Record<string, { score: string; comment: string }>>({});
  const [overallComment, setOverallComment] = useState('');

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

  // Reload an overall comment already saved for this seat, so resubmitting does
  // not force the panelist to retype it.
  useEffect(() => {
    const mine = panel?.panelists.find((p) => p.evaluation);
    if (mine?.evaluation) setOverallComment(mine.evaluation.overallComment);
  }, [panel]);

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
    submit.mutate({ scores: payload, overallComment: overallComment.trim() || undefined });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </p>
        <div className="flex items-center gap-2">
          {session.isOverdue && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">overdue</span>
          )}
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{session.status}</span>
        </div>
      </div>

      {(session.scheduledStart || session.location) && (
        <p className="mt-1 text-xs text-gray-500">
          {session.scheduledStart && new Date(session.scheduledStart).toLocaleString()}
          {session.location && ` · ${session.location}`}
        </p>
      )}

      <PresentationTimer cpiId={cpiId} session={session} />

      {openVisibility && (
        <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This evaluation is open: everyone on the panel can see each other&rsquo;s marks.
        </p>
      )}

      <div className="mt-3 space-y-2">
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

      <div className="mt-3">
        <label className="text-xs font-medium text-gray-700">
          Overall comment{commentRequired && <span className="text-red-600"> *</span>}
        </label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          disabled={locked}
          rows={3}
          placeholder="Your overall assessment of this evaluation"
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
        />
      </div>

      {locked && (
        <p className="mt-2 text-xs text-gray-500">
          Scoring is closed for this session — it is awaiting or has completed review.
        </p>
      )}
      {submit.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(submit.error)}</p>
      )}
      {submit.isSuccess && <p className="mt-2 text-xs text-green-600">Scores submitted.</p>}

      {!locked && (
        <button
          onClick={onSubmit}
          disabled={submit.isPending || (commentRequired && !overallComment.trim())}
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
  // Poll so the shared presentation timer stays in sync across evaluators.
  const { data: sessions, isLoading, isError, error } = useSessions(cpiId, { refetchInterval: 3000 });
  const { data: config } = useEvaluationConfig(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading sessions…</p>;
  if (isError) {
    // Not an evaluator here (e.g. a supervisor who opened this tab) — inform,
    // don't alarm.
    if (getApiErrorStatus(error) === 403) {
      return (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          This tab is for assigned evaluators — you have no evaluation sessions in this course.
        </p>
      );
    }
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
