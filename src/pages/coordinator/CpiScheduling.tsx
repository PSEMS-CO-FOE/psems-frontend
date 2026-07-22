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

  return (
    <li className="flex flex-wrap items-center gap-2 py-2 text-xs">
      <span className="text-gray-700">
        {session.group.name} · {session.stage.name}{' '}
        <span className="text-gray-400">({session.status})</span>
      </span>
      {session.scheduledStart && (
        <span className="text-gray-400">
          @ {new Date(session.scheduledStart).toLocaleString()}
        </span>
      )}
      <span className="ml-auto flex items-center gap-1">
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
        <button
          onClick={() =>
            schedule.mutate({
              sessionId: session.id,
              scheduledStart: new Date(start).toISOString(),
              scheduledEnd: new Date(end).toISOString(),
            })
          }
          disabled={!start || !end || schedule.isPending}
          className="rounded bg-gray-700 px-2 py-0.5 text-white hover:bg-gray-600 disabled:opacity-50"
        >
          set time
        </button>
      </span>
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
