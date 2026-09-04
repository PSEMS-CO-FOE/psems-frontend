import { useMemo, useState } from 'react';
import { AvailabilityGrid, AvailabilityLegend } from '@/components/AvailabilityGrid';
import {
  useAlternativeSlots,
  useAvailability,
  useGenerateSessions,
  useScheduleSession,
  useScheduleSessions,
  useSessions,
  useSetAvailabilityTemplate,
  type EvaluationSession,
  type ScheduleConflict,
} from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';
import { sessionStatusLabel } from '@/lib/labels';
import { personName, shortName } from '@/lib/name';
import { ScheduleSheetPanel } from './ScheduleSheetPanel';
import { Badge, Button, Card, EmptyState, Notice, StatRow, StatTile } from '@/components/ui';

const CONFLICT_LABELS: Record<ScheduleConflict['kind'], string> = {
  PANELIST_DOUBLE_BOOKED: 'Panelist double-booked',
  GROUP_DOUBLE_BOOKED: 'Group double-booked',
  ROOM_DOUBLE_BOOKED: 'Room double-booked',
  OUTSIDE_AVAILABILITY: 'Outside submitted availability',
  REQUIRED_PANELIST_MISSING: 'Required panelist missing',
};

// A datetime-local input needs local date and time text, not an ISO timestamp.
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AvailabilityTemplatePanel({ cpiId }: { cpiId: string }) {
  const { data } = useAvailability(cpiId);
  const setTemplate = useSetAvailabilityTemplate(cpiId);
  const [open, setOpen] = useState(false);
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [slots, setSlots] = useState([{ name: 'Morning', startTime: '09:00', endTime: '12:00' }]);

  const template = data?.template ?? null;

  // Each cell shows how many people are free, not one person's answer.
  const summary = useMemo(() => {
    const counts = new Map<string, { available: number; tentative: number; total: number }>();
    for (const entry of data?.entries ?? []) {
      const key = `${entry.slotDate}|${entry.templateSlotId}`;
      const cell = counts.get(key) ?? { available: 0, tentative: 0, total: 0 };
      if (entry.status === 'AVAILABLE') cell.available++;
      if (entry.status === 'TENTATIVE') cell.tentative++;
      cell.total++;
      counts.set(key, cell);
    }
    return (slotDate: string, slot: { id: string }) =>
      counts.get(`${slotDate}|${slot.id}`) ?? { available: 0, tentative: 0, total: 0 };
  }, [data]);

  return (
    <div className="rounded-control border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-muted">Availability grid</p>
        <button onClick={() => setOpen((v) => !v)} className="rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400">
          {open ? 'Cancel' : template ? 'Redefine grid' : 'Set up grid'}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-caution-700">
            Republishing replaces the slots, and answers given against a removed slot go with it.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-ink-muted">
              from
              <input
                type="date"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="ml-1 rounded-control border border-line-strong px-2 py-1"
              />
            </label>
            <label className="text-ink-muted">
              to
              <input
                type="date"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="ml-1 rounded-control border border-line-strong px-2 py-1"
              />
            </label>
          </div>

          {slots.map((slot, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
              <input
                value={slot.name}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, name: e.target.value } : s)))}
                placeholder="Morning"
                className="w-32 rounded-control border border-line-strong px-2 py-1"
              />
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, startTime: e.target.value } : s)))}
                className="rounded-control border border-line-strong px-2 py-1"
              />
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, endTime: e.target.value } : s)))}
                className="rounded-control border border-line-strong px-2 py-1"
              />
              {slots.length > 1 && (
                <button
                  onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                  className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60"
                >
                  remove
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlots([...slots, { name: '', startTime: '13:00', endTime: '17:00' }])}
              className="rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400"
            >
              + add slot
            </button>
            <Button variant="primary" size="sm"
              onClick={() =>
                setTemplate.mutate(
                  { windowStart, windowEnd, slots },
                  { onSuccess: () => setOpen(false) },
                )
              }
              disabled={!windowStart || !windowEnd || slots.some((s) => !s.name.trim()) || setTemplate.isPending}>
              {setTemplate.isPending ? '…' : 'Publish grid'}
            </Button>
          </div>
          {setTemplate.isError && (
            <Notice tone="critical" size="xs">{getApiErrorMessage(setTemplate.error)}</Notice>
          )}
        </div>
      )}

      {!template && !open && <EmptyState density="compact" title="No availability grid yet" hint="Publish a grid so evaluators can mark which slots they are free." />}

      {template && (
        <div className="mt-2 space-y-2">
          <AvailabilityLegend />
          <AvailabilityGrid template={template} values={new Map()} readOnly summary={summary} />
          {data && data.outstanding.length > 0 && (
            <p className="text-xs text-caution-700">
              Still to answer: {data.outstanding.map((l) => shortName(personName(l.user))).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Shown after a clash. Picking one of these times moves the session there.
function AlternativeSlots({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useAlternativeSlots(cpiId, open ? session.id : null);
  const schedule = useScheduleSession(cpiId);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="self-start rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400">
        Find a slot everyone can make
      </button>
    );
  }

  return (
    <div className="rounded-control bg-canvas-sunken px-2 py-1">
      {isLoading && <span className="text-xs text-ink-muted">Checking availability…</span>}
      {data && data.length === 0 && (
        <span className="text-xs text-ink-muted">
          No slot works for every required panelist — widen the grid or change the panel.
        </span>
      )}
      <ul className="space-y-0.5">
        {data?.map((slot) => (
          <li key={`${slot.slotDate}-${slot.templateSlotId}`} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink">
              {new Date(slot.start).toLocaleString()} · {slot.slotName}
            </span>
            {!slot.allAvailable && (
              <span className="text-caution-700">tentative: {slot.tentative.join(', ')}</span>
            )}
            {slot.sessionsAlreadyInSlot > 0 && (
              <span className="text-ink-subtle">{slot.sessionsAlreadyInSlot} other session(s) in this slot</span>
            )}
            <Button variant="neutral" size="sm"
              onClick={() =>
                schedule.mutate(
                  {
                    sessionId: session.id,
                    scheduledStart: slot.start,
                    scheduledEnd: slot.end,
                    location: session.location ?? undefined,
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }>
              move here
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionRow({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const schedule = useScheduleSession(cpiId);
  const [start, setStart] = useState(session.scheduledStart ? toLocalInput(session.scheduledStart) : '');
  const [end, setEnd] = useState(session.scheduledEnd ? toLocalInput(session.scheduledEnd) : '');
  const [location, setLocation] = useState(session.location ?? '');

  const conflicts = schedule.data?.conflicts ?? [];

  return (
    <li className="flex flex-col gap-1 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink">
          {session.group.name} · {session.stage.name}{' '}
          <span className="text-ink-subtle">({sessionStatusLabel(session.status)})</span>
        </span>
        {session.isOverdue && (
          <Badge tone="critical">overdue, not yet scored</Badge>
        )}
        {session.scheduledStart && (
          <span className="text-ink-subtle">@ {new Date(session.scheduledStart).toLocaleString()}</span>
        )}
        {session.location && <span className="text-ink-muted">· {session.location}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-control border border-line-strong px-1 py-0.5 text-xs"
        />
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-control border border-line-strong px-1 py-0.5 text-xs"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="room / link (optional)"
          className="w-40 rounded-control border border-line-strong px-2 py-0.5 text-xs"
        />
        <Button variant="neutral" size="sm"
          onClick={() =>
            schedule.mutate({
              sessionId: session.id,
              scheduledStart: new Date(start).toISOString(),
              scheduledEnd: new Date(end).toISOString(),
              location: location.trim() || undefined,
            })
          }
          disabled={!start || !end || schedule.isPending}>
          {session.scheduledStart ? 'move' : 'set time'}
        </Button>
      </div>

      {schedule.isError && <span className="text-critical-700">{getApiErrorMessage(schedule.error)}</span>}
      {schedule.isSuccess && conflicts.length === 0 && <span className="text-positive-700">Scheduled. No conflicts.</span>}

      {conflicts.length > 0 && (
        <div className="rounded-control bg-caution-50 px-2 py-1 text-caution-700">
          ⚠ Scheduled anyway — {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}:
          <ul className="mt-0.5 list-disc pl-4">
            {conflicts.map((c, i) => (
              <li key={i}>
                <span className="font-medium">{CONFLICT_LABELS[c.kind]}:</span> {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {conflicts.length > 0 && <AlternativeSlots cpiId={cpiId} session={session} />}
    </li>
  );
}

// Placing twenty groups one at a time is the work a coordinator actually
// complains about. This lays every unplaced session out back to back from a
// start time, which is how a demo day is run in practice; individual rows can
// still be nudged afterwards.
function BlockLayout({ cpiId, sessions }: { cpiId: string; sessions: EvaluationSession[] }) {
  const schedule = useScheduleSessions(cpiId);
  const [start, setStart] = useState('');
  const [minutes, setMinutes] = useState('20');
  const [gap, setGap] = useState('0');
  const [location, setLocation] = useState('');
  const [onlyUnplaced, setOnlyUnplaced] = useState(true);

  const targets = onlyUnplaced ? sessions.filter((s) => s.scheduledStart === null) : sessions;

  const apply = () => {
    const slot = Number(minutes) || 0;
    const between = Number(gap) || 0;
    if (!start || slot <= 0 || targets.length === 0) return;

    const first = new Date(start).getTime();
    schedule.mutate(
      targets.map((session, i) => {
        const from = first + i * (slot + between) * 60_000;
        return {
          sessionId: session.id,
          scheduledStart: new Date(from).toISOString(),
          scheduledEnd: new Date(from + slot * 60_000).toISOString(),
          location: location.trim() || undefined,
          allocatedMinutes: slot,
        };
      }),
    );
  };

  const clashes = schedule.data?.results.filter((r) => r.conflicts.length > 0).length ?? 0;

  return (
    <div className="border-t pt-3">
      <p className="text-xs font-medium text-ink">Lay out a block</p>
      <p className="mt-0.5 text-xs text-ink-subtle">
        Places {targets.length} session{targets.length === 1 ? '' : 's'} one after another. Clashes are reported, never
        blocked — you can still fix them row by row.
      </p>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-xs text-ink-muted">
          First session
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-0.5 block rounded-control border border-line-strong px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Each takes
          <span className="mt-0.5 flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-20 rounded-control border border-line-strong px-2 py-1 text-sm"
            />
            <span className="text-sm text-ink-muted">min</span>
          </span>
        </label>
        <label className="text-xs text-ink-muted">
          Gap between
          <span className="mt-0.5 flex items-center gap-1">
            <input
              type="number"
              min={0}
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              className="w-20 rounded-control border border-line-strong px-2 py-1 text-sm"
            />
            <span className="text-sm text-ink-muted">min</span>
          </span>
        </label>
        <label className="text-xs text-ink-muted">
          Venue
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="optional"
            className="mt-0.5 block w-40 rounded-control border border-line-strong px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink-muted">
          <input type="checkbox" checked={onlyUnplaced} onChange={(e) => setOnlyUnplaced(e.target.checked)} />
          only ones with no time yet
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={apply}
          disabled={!start || targets.length === 0 || schedule.isPending}
        >
          {schedule.isPending ? '\u2026' : `Place ${targets.length}`}
        </Button>
      </div>

      {schedule.isError && (
        <Notice tone="critical" size="xs" className="mt-1">{getApiErrorMessage(schedule.error)}</Notice>
      )}
      {schedule.isSuccess && (
        <p className="mt-1 text-xs text-ink-muted">
          Placed {schedule.data.scheduled}.{' '}
          {clashes > 0 ? `${clashes} have a clash worth checking below.` : 'No clashes.'}
        </p>
      )}
    </div>
  );
}

export function CpiScheduling({ cpiId }: { cpiId: string }) {
  const { data: sessions } = useSessions(cpiId);
  const generate = useGenerateSessions(cpiId);

  const total = sessions?.length ?? 0;
  const scheduled = sessions?.filter((s) => s.scheduledStart !== null).length ?? 0;
  const overdue = sessions?.filter((s) => s.isOverdue).length ?? 0;

  return (
    <div className="space-y-5">
      <StatRow>
        <StatTile label="Sessions" value={total} caption={total === 0 ? 'None generated yet' : 'One per group and stage'} />
        <StatTile
          label="Given a time"
          value={`${scheduled} / ${total}`}
          caption={total - scheduled === 0 ? 'The timetable is complete' : `${total - scheduled} still to place`}
        />
        <StatTile
          label="Overdue"
          value={overdue}
          caption={overdue === 0 ? 'Nothing has slipped' : 'Time passed, not yet scored'}
        />
        <StatTile label="Finalized" value={sessions?.filter((s) => s.status === 'FINALIZED').length ?? 0} caption="Scoring closed and approved" />
      </StatRow>

      <AvailabilityTemplatePanel cpiId={cpiId} />

      <Card
        title="Sessions"
        description="One per group and stage. Generate them, then give each a time and a room."
        actions={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? 'Generating…' : 'Generate sessions'}
          </Button>
        }
      >
        {generate.isError && (
          <Notice tone="critical" size="xs" className="mb-3">
            {getApiErrorMessage(generate.error)}
          </Notice>
        )}

        <ul className="divide-y divide-line">
          {sessions?.map((s) => (
            <SessionRow key={s.id} cpiId={cpiId} session={s} />
          ))}
          {sessions && sessions.length === 0 && (
            <li>
              <EmptyState
                title="No sessions yet"
                hint="Generate sessions to create one per group and stage, then give each a time."
              />
            </li>
          )}
        </ul>
      </Card>

      {sessions && sessions.length > 0 && <BlockLayout cpiId={cpiId} sessions={sessions} />}

      <ScheduleSheetPanel cpiId={cpiId} />
    </div>
  );
}
