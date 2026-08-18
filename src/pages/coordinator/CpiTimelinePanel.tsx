import { useMemo, useState } from 'react';
import { useCpiDetail, useSetTimeline } from '@/features/courses/useCpiDetail';
import { statusOfPhase } from '@/features/courses/phaseStatus';
import { PHASE_ORDER, type CpiPhaseName } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, ErrorText, Notice } from '@/components/ui';

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Phase names as a coordinator would say them out loud.
const PHASE_LABEL: Record<CpiPhaseName, string> = {
  STUDENT_REGISTRATION: 'Student registration',
  SUPERVISOR_ADDITION: 'Supervisor addition',
  IDEA_ANNOUNCEMENT: 'Idea announcement',
  PROJECT_SELECTION: 'Project selection',
  PROJECT_REGISTRATION: 'Project registration',
  EVALUATION_CONFIG: 'Evaluation setup',
  PROPOSAL_SUBMISSION: 'Proposal submission',
  AVAILABILITY_SUBMISSION: 'Availability submission',
  EVALUATION_EXECUTION: 'Evaluations',
  FINAL_SUBMISSION: 'Final submission',
};

type PhaseRow = { enabled: boolean; startDate: string; endDate: string };

// Default timeline: each phase a 7-day window, all enabled. A coordinator can
// disable phases their course doesn't need.
function defaultRows(): Record<CpiPhaseName, PhaseRow> {
  const base = new Date();
  base.setDate(base.getDate() - 7);
  const rows = {} as Record<CpiPhaseName, PhaseRow>;
  PHASE_ORDER.forEach((phase, i) => {
    const start = new Date(base);
    start.setDate(base.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    rows[phase] = { enabled: true, startDate: toInputDate(start), endDate: toInputDate(end) };
  });
  return rows;
}

export function CpiTimelinePanel({ cpiId }: { cpiId: string }) {
  const { data: cpi } = useCpiDetail(cpiId);
  const setTimeline = useSetTimeline(cpiId);

  // Editor state, seeded once from the existing (possibly partial) timeline.
  const [rows, setRows] = useState(defaultRows);
  const [seeded, setSeeded] = useState(false);
  if (cpi && !seeded) {
    if (cpi.timeline.length > 0) {
      const next = defaultRows();
      PHASE_ORDER.forEach((p) => (next[p].enabled = false));
      cpi.timeline.forEach((t) => {
        next[t.phase] = { enabled: true, startDate: t.startDate.slice(0, 10), endDate: t.endDate.slice(0, 10) };
      });
      setRows(next);
    }
    setSeeded(true);
  }

  const enabledPhases = useMemo(() => PHASE_ORDER.filter((p) => rows[p].enabled), [rows]);

  // Client-side validation mirroring the backend rules (over enabled phases only).
  const clientErrors = useMemo(() => {
    const errs: string[] = [];
    if (enabledPhases.length === 0) errs.push('Enable at least one phase');
    enabledPhases.forEach((p) => {
      if (rows[p].startDate >= rows[p].endDate) errs.push(`${PHASE_LABEL[p]}: start must be before end`);
    });
    for (let i = 1; i < enabledPhases.length; i++) {
      if (rows[enabledPhases[i]].startDate < rows[enabledPhases[i - 1]].startDate) {
        errs.push(`${PHASE_LABEL[enabledPhases[i]]} cannot start before ${PHASE_LABEL[enabledPhases[i - 1]]}`);
      }
    }
    return errs;
  }, [rows, enabledPhases]);

  const updateRow = (phase: CpiPhaseName, field: 'startDate' | 'endDate', value: string) =>
    setRows((prev) => ({ ...prev, [phase]: { ...prev[phase], [field]: value } }));
  const toggleRow = (phase: CpiPhaseName) =>
    setRows((prev) => ({ ...prev, [phase]: { ...prev[phase], enabled: !prev[phase].enabled } }));

  const onSave = () => {
    if (clientErrors.length > 0) return;
    setTimeline.mutate(
      enabledPhases.map((phase) => ({ phase, startDate: rows[phase].startDate, endDate: rows[phase].endDate })),
    );
  };

  const today = toInputDate(new Date());

  return (
    <Card
      title="Timeline"
      description="Enable the phases this course uses; phase starts must be in order. Saving replaces the whole timeline."
      actions={
        <Button variant="primary" size="sm" onClick={onSave} disabled={clientErrors.length > 0 || setTimeline.isPending}>
          {setTimeline.isPending ? 'Saving…' : 'Save timeline'}
        </Button>
      }
    >
      {setTimeline.isError && (
        <Notice tone="critical" className="mb-3">
          {getApiErrorMessage(setTimeline.error, 'Could not save timeline')}
        </Notice>
      )}
      {setTimeline.isSuccess && (
        <Notice tone="positive" className="mb-3">
          Timeline saved.
        </Notice>
      )}

      <div className="space-y-1.5">
        {PHASE_ORDER.map((phase, i) => {
          const saved = cpi?.timeline.find((t) => t.phase === phase);
          const status = saved ? statusOfPhase(saved, today) : undefined;
          return (
            <div key={phase} className="flex flex-wrap items-center gap-2">
              <label className="flex min-w-56 flex-1 items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={rows[phase].enabled} onChange={() => toggleRow(phase)} />
                <span className={rows[phase].enabled ? '' : 'text-ink-subtle line-through'}>
                  {i + 1}. {PHASE_LABEL[phase]}
                </span>
                {status === 'open' && <Badge tone="brand">open now</Badge>}
              </label>
              <input
                type="date"
                aria-label={`${PHASE_LABEL[phase]} start`}
                value={rows[phase].startDate}
                onChange={(e) => updateRow(phase, 'startDate', e.target.value)}
                disabled={!rows[phase].enabled}
                className="rounded-control border border-line-strong bg-surface px-2 py-1 text-sm disabled:bg-canvas disabled:text-ink-subtle"
              />
              <input
                type="date"
                aria-label={`${PHASE_LABEL[phase]} end`}
                value={rows[phase].endDate}
                onChange={(e) => updateRow(phase, 'endDate', e.target.value)}
                disabled={!rows[phase].enabled}
                className="rounded-control border border-line-strong bg-surface px-2 py-1 text-sm disabled:bg-canvas disabled:text-ink-subtle"
              />
            </div>
          );
        })}
      </div>

      {clientErrors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {clientErrors.map((e) => (
            <li key={e}>
              <ErrorText>{e}</ErrorText>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
