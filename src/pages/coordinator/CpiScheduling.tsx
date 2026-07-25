import { useState } from 'react';
import {
  useSessions,
  useAvailability,
  useGenerateSessions,
  useScheduleSession,
} from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

function SessionRow({ cpiId, session }: { cpiId: string; session: import('@/features/scheduling/useScheduling').EvaluationSession }) {
  const schedule = useScheduleSession(cpiId);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');

  const conflicts = schedule.data?.conflicts ?? [];

  return (
    <li className="flex flex-col gap-1 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-700">
          {session.group.name} · {session.stage.name}{' '}
          <span className="text-gray-400">({session.status})</span>
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
          set time
        </button>
      </div>

      {schedule.isError && (
        <span className="text-red-600">{getApiErrorMessage(schedule.error)}</span>
      )}
      {schedule.isSuccess && conflicts.length === 0 && (
        <span className="text-green-600">Scheduled. No conflicts.</span>
      )}
      {conflicts.length > 0 && (
        <div className="rounded bg-yellow-50 px-2 py-1 text-yellow-800">
          ⚠ Scheduled, but overlaps {conflicts.length} other session
          {conflicts.length > 1 ? 's' : ''} sharing an evaluator:
          <ul className="mt-0.5 list-disc pl-4">
            {conflicts.map((c) => (
              <li key={c.sessionId}>
                {c.group} · {c.stage}
                {c.scheduledStart && ` @ ${new Date(c.scheduledStart).toLocaleString()}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function CpiScheduling({ cpiId }: { cpiId: string }) {
  const { data: sessions } = useSessions(cpiId);
  const { data: availability } = useAvailability(cpiId);
  const generate = useGenerateSessions(cpiId);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Scheduling</h3>

      {/* Submitted availability */}
      <div className="mt-2">
        <p className="text-xs font-medium text-gray-600">Evaluator availability</p>
        {availability && availability.length === 0 && (
          <p className="text-xs text-gray-500">No slots submitted.</p>
        )}
        <ul className="mt-1 space-y-0.5">
          {availability?.map((a) => (
            <li key={a.id} className="text-xs text-gray-600">
              {personName(a.cpiEvaluator.lecturer.user)}: {new Date(a.slotStart).toLocaleString()} –{' '}
              {new Date(a.slotEnd).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>

      {/* Generate + session list */}
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {generate.isPending ? '…' : 'Generate sessions'}
          </button>
          {generate.isError && (
            <span className="text-xs text-red-600">{getApiErrorMessage(generate.error)}</span>
          )}
        </div>

        <ul className="mt-2 divide-y">
          {sessions?.map((s) => (
            <SessionRow key={s.id} cpiId={cpiId} session={s} />
          ))}
          {sessions && sessions.length === 0 && (
            <li className="py-2 text-xs text-gray-500">No sessions yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
