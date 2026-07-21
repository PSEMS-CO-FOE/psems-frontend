import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCpiDetail, useSetTimeline } from '@/features/courses/useCpiDetail';
import { PHASE_ORDER, type CpiPhaseName } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { CpiAssignments } from './CpiAssignments';

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Default timeline: SUPERVISOR_ADDITION opens today, each phase a 7-day window.
function defaultRows(): Record<CpiPhaseName, { startDate: string; endDate: string }> {
  const base = new Date();
  base.setDate(base.getDate() - 7);
  const rows = {} as Record<CpiPhaseName, { startDate: string; endDate: string }>;
  PHASE_ORDER.forEach((phase, i) => {
    const start = new Date(base);
    start.setDate(base.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    rows[phase] = { startDate: toInputDate(start), endDate: toInputDate(end) };
  });
  return rows;
}

export function CpiDetailPage() {
  const { cpiId = '' } = useParams();
  const { data: cpi, isLoading, isError, error } = useCpiDetail(cpiId);
  const setTimeline = useSetTimeline(cpiId);

  // Timeline editor state, seeded from existing timeline or defaults.
  const [rows, setRows] = useState(defaultRows);
  const [seeded, setSeeded] = useState(false);
  if (cpi && !seeded) {
    if (cpi.timeline.length === 10) {
      const next = {} as Record<CpiPhaseName, { startDate: string; endDate: string }>;
      cpi.timeline.forEach((t) => {
        next[t.phase] = { startDate: t.startDate.slice(0, 10), endDate: t.endDate.slice(0, 10) };
      });
      setRows(next);
    }
    setSeeded(true);
  }

  // Client-side validation mirroring the backend rules.
  const clientErrors = useMemo(() => {
    const errs: string[] = [];
    PHASE_ORDER.forEach((p) => {
      if (rows[p].startDate >= rows[p].endDate) errs.push(`${p}: start must be before end`);
    });
    for (let i = 1; i < PHASE_ORDER.length; i++) {
      if (rows[PHASE_ORDER[i]].startDate < rows[PHASE_ORDER[i - 1]].startDate) {
        errs.push(`${PHASE_ORDER[i]} cannot start before ${PHASE_ORDER[i - 1]}`);
      }
    }
    return errs;
  }, [rows]);

  const updateRow = (phase: CpiPhaseName, field: 'startDate' | 'endDate', value: string) =>
    setRows((prev) => ({ ...prev, [phase]: { ...prev[phase], [field]: value } }));

  const onSave = () => {
    if (clientErrors.length > 0) return;
    setTimeline.mutate(PHASE_ORDER.map((phase) => ({ phase, ...rows[phase] })));
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading CPI…</p>;
  if (isError || !cpi) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load this CPI')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/coordinator" className="text-sm text-blue-600 hover:underline">
        ← Back to CPIs
      </Link>

      {/* CPI header */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-bold text-gray-800">{cpi.name}</h2>
        <p className="mt-1 text-xs text-gray-500">
          {cpi.projectType} · {cpi.participationMode} · {cpi.department} · {cpi.academicYear}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Mode: <span className="font-medium">{cpi.mode ?? 'not set (decided in supervisor step)'}</span>
        </p>
      </div>

      {/* Timeline editor */}
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Timeline — all 10 phases</h3>
        <p className="mt-1 text-xs text-gray-500">
          Phase starts must be in order. Saving replaces the whole timeline.
        </p>

        {setTimeline.isError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(setTimeline.error, 'Could not save timeline')}
          </p>
        )}
        {setTimeline.isSuccess && (
          <p className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            Timeline saved.
          </p>
        )}

        <div className="mt-3 space-y-2">
          {PHASE_ORDER.map((phase, i) => (
            <div key={phase} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
              <span className="text-xs text-gray-700">
                {i + 1}. {phase}
              </span>
              <input
                type="date"
                value={rows[phase].startDate}
                onChange={(e) => updateRow(phase, 'startDate', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <input
                type="date"
                value={rows[phase].endDate}
                onChange={(e) => updateRow(phase, 'endDate', e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </div>
          ))}
        </div>

        {clientErrors.length > 0 && (
          <ul className="mt-3 space-y-1">
            {clientErrors.map((e) => (
              <li key={e} className="text-xs text-red-600">
                {e}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onSave}
          disabled={clientErrors.length > 0 || setTimeline.isPending}
          className="mt-4 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {setTimeline.isPending ? 'Saving…' : 'Save timeline'}
        </button>
      </div>

      <CpiAssignments cpiId={cpiId} mode={cpi.mode} />

      {/* Current supervisors + evaluators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">Supervisors</h3>
          {cpi.supervisors.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">None invited.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {cpi.supervisors.map((s) => (
                <li key={s.id} className="text-xs text-gray-700">
                  {s.lecturer.user.fullName ?? s.lecturer.user.email} —{' '}
                  <span className="text-gray-400">{s.invitationStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">Evaluators</h3>
          {cpi.evaluators.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">None assigned.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {cpi.evaluators.map((e) => (
                <li key={e.id} className="text-xs text-gray-700">
                  {e.lecturer.user.fullName ?? e.lecturer.user.email}
                  {e.isHeadJudge && (
                    <span className="ml-1 rounded bg-purple-100 px-1 text-purple-700">Head Judge</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
