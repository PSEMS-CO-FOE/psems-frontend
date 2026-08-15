import { useMemo, useState } from 'react';
import { AvailabilityGrid, AvailabilityLegend } from '@/components/AvailabilityGrid';
import {
  useAlternativeSlots,
  useAvailability,
  useGenerateSessions,
  useScheduleSession,
  useSessions,
  useSetAvailabilityTemplate,
  type EvaluationSession,
  type ScheduleConflict,
} from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { ScheduleSheetPanel } from './ScheduleSheetPanel';

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
    <div className="rounded border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">Availability grid</p>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-blue-600 hover:underline">
          {open ? 'Cancel' : template ? 'Redefine grid' : 'Set up grid'}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-amber-600">
            Republishing replaces the slots, and answers given against a removed slot go with it.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-gray-500">
              from
              <input
                type="date"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="ml-1 rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="text-gray-500">
              to
              <input
                type="date"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="ml-1 rounded border border-gray-300 px-2 py-1"
              />
            </label>
          </div>

          {slots.map((slot, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
              <input
                value={slot.name}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, name: e.target.value } : s)))}
                placeholder="Morning"
                className="w-32 rounded border border-gray-300 px-2 py-1"
              />
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, startTime: e.target.value } : s)))}
                className="rounded border border-gray-300 px-2 py-1"
              />
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => setSlots(slots.map((s, j) => (i === j ? { ...s, endTime: e.target.value } : s)))}
                className="rounded border border-gray-300 px-2 py-1"
              />
              {slots.length > 1 && (
                <button
                  onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                  className="text-red-600 hover:underline"
                >
                  remove
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlots([...slots, { name: '', startTime: '13:00', endTime: '17:00' }])}
              className="text-xs text-blue-600 hover:underline"
            >
              + add slot
            </button>
            <button
              onClick={() =>
                setTemplate.mutate(
                  { windowStart, windowEnd, slots },
                  { onSuccess: () => setOpen(false) },
                )
              }
              disabled={!windowStart || !windowEnd || slots.some((s) => !s.name.trim()) || setTemplate.isPending}
              className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {setTemplate.isPending ? '…' : 'Publish grid'}
            </button>
          </div>
          {setTemplate.isError && (
            <p className="text-xs text-red-600">{getApiErrorMessage(setTemplate.error)}</p>
          )}
        </div>
      )}

      {!template && !open && <p className="mt-1 text-xs text-gray-500">No grid published yet.</p>}

      {template && (
        <div className="mt-2 space-y-2">
          <AvailabilityLegend />
          <AvailabilityGrid template={template} values={new Map()} readOnly summary={summary} />
          {data && data.outstanding.length > 0 && (
            <p className="text-xs text-amber-700">
              Still to answer: {data.outstanding.map((l) => personName(l.user)).join(', ')}
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
      <button onClick={() => setOpen(true)} className="self-start text-xs text-blue-600 hover:underline">
        Find a slot everyone can make
      </button>
    );
  }

  return (
    <div className="rounded bg-gray-50 px-2 py-1">
      {isLoading && <span className="text-xs text-gray-500">Checking availability…</span>}
      {data && data.length === 0 && (
        <span className="text-xs text-gray-500">
          No slot works for every required panelist — widen the grid or change the panel.
        </span>
      )}
      <ul className="space-y-0.5">
        {data?.map((slot) => (
          <li key={`${slot.slotDate}-${slot.templateSlotId}`} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-700">
              {new Date(slot.start).toLocaleString()} · {slot.slotName}
            </span>
            {!slot.allAvailable && (
              <span className="text-yellow-700">tentative: {slot.tentative.join(', ')}</span>
            )}
            {slot.sessionsAlreadyInSlot > 0 && (
              <span className="text-gray-400">{slot.sessionsAlreadyInSlot} other session(s) in this slot</span>
            )}
            <button
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
              }
              className="rounded bg-gray-700 px-2 py-0.5 text-white hover:bg-gray-600"
            >
              move here
            </button>
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
        <span className="text-gray-700">
          {session.group.name} · {session.stage.name} <span className="text-gray-400">({session.status})</span>
        </span>
        {session.isOverdue && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">overdue, not yet scored</span>
        )}
        {session.scheduledStart && (
          <span className="text-gray-400">@ {new Date(session.scheduledStart).toLocaleString()}</span>
        )}
        {session.location && <span className="text-gray-500">· {session.location}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded border border-gray-300 px-1 py-0.5 text-xs"
        />
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded border border-gray-300 px-1 py-0.5 text-xs"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="room / link (optional)"
          className="w-40 rounded border border-gray-300 px-2 py-0.5 text-xs"
        />
        <button
          onClick={() =>
            schedule.mutate({
              sessionId: session.id,
              scheduledStart: new Date(start).toISOString(),
              scheduledEnd: new Date(end).toISOString(),
              location: location.trim() || undefined,
            })
          }
          disabled={!start || !end || schedule.isPending}
          className="rounded bg-gray-700 px-2 py-0.5 text-white hover:bg-gray-600 disabled:opacity-50"
        >
          {session.scheduledStart ? 'move' : 'set time'}
        </button>
      </div>

      {schedule.isError && <span className="text-red-600">{getApiErrorMessage(schedule.error)}</span>}
      {schedule.isSuccess && conflicts.length === 0 && <span className="text-green-600">Scheduled. No conflicts.</span>}

      {conflicts.length > 0 && (
        <div className="rounded bg-yellow-50 px-2 py-1 text-yellow-800">
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

export function CpiScheduling({ cpiId }: { cpiId: string }) {
  const { data: sessions } = useSessions(cpiId);
  const generate = useGenerateSessions(cpiId);

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Scheduling</h3>

      <AvailabilityTemplatePanel cpiId={cpiId} />

      <div className="border-t pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {generate.isPending ? '…' : 'Generate sessions'}
          </button>
          {generate.isError && <span className="text-xs text-red-600">{getApiErrorMessage(generate.error)}</span>}
        </div>

        <ul className="mt-2 divide-y">
          {sessions?.map((s) => (
            <SessionRow key={s.id} cpiId={cpiId} session={s} />
          ))}
          {sessions && sessions.length === 0 && <li className="py-2 text-xs text-gray-500">No sessions yet.</li>}
        </ul>
      </div>

      <ScheduleSheetPanel cpiId={cpiId} />
    </div>
  );
}
