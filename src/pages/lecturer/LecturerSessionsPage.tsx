import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSessions,
  useControlTimer,
  type EvaluationSession,
} from '@/features/scheduling/useScheduling';
import { useEvaluationConfig, type SavedCriterion } from '@/features/evaluations/useEvaluationConfig';
import { useSessionScores, useSubmitScores } from '@/features/scoring/useScoring';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Shared presentation timer. State lives on the server; this page polls, so
// when one evaluator starts/pauses/stops, every evaluator's clock reflects it.
// Between polls we tick locally for smoothness and resync on each server value.
function PresentationTimer({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const control = useControlTimer(cpiId);
  const [display, setDisplay] = useState(session.timerElapsedSeconds);

  // Resync to the authoritative server value whenever it changes (each poll).
  useEffect(() => {
    setDisplay(session.timerElapsedSeconds);
  }, [session.timerElapsedSeconds]);

  // Tick locally only while the shared timer is running.
  useEffect(() => {
    if (!session.timerRunning) return;
    const id = setInterval(() => setDisplay((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [session.timerRunning]);

  const act = (action: 'start' | 'pause' | 'stop' | 'reset') =>
    control.mutate({ sessionId: session.id, action });

  const saved = session.presentationDurationSeconds;

  return (
    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-lg tabular-nums text-gray-800">{formatDuration(display)}</span>
        {session.timerRunning ? (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">running</span>
        ) : (
          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">stopped</span>
        )}
        {!session.timerRunning ? (
          <button
            onClick={() => act('start')}
            disabled={control.isPending}
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {display > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={() => act('pause')}
            disabled={control.isPending}
            className="rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            Pause
          </button>
        )}
        <button
          onClick={() => act('stop')}
          disabled={control.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Stop &amp; save
        </button>
        <button
          onClick={() => act('reset')}
          disabled={control.isPending}
          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {saved != null
          ? `Saved presentation time: ${formatDuration(saved)}`
          : 'Shared across all evaluators in the room.'}
      </p>
      {control.isError && <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(control.error)}</p>}
    </div>
  );
}

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
  // Scoring is only open while SCHEDULED (still collecting) or CORRECTION_REQUESTED
  // (reopened for this evaluator). Once AWAITING_HEAD_JUDGE or FINALIZED, the
  // backend rejects writes — mirror that here so inputs are disabled too.
  const locked = session.status !== 'SCHEDULED' && session.status !== 'CORRECTION_REQUESTED';

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

      {locked && (
        <p className="mt-2 text-xs text-gray-500">
          Scoring is closed for this session (awaiting or completed Head Judge review).
        </p>
      )}
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
