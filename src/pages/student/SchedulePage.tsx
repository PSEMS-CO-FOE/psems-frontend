import { useParams } from 'react-router-dom';
import { useSessions } from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';

function formatSlot(start: string | null, end: string | null) {
  if (!start) return null;
  const from = new Date(start);
  const date = from.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return end ? `${date}, ${time(from)} – ${time(new Date(end))}` : `${date}, ${time(from)}`;
}

export function SchedulePage() {
  const { cpiId = '' } = useParams();
  const { data: sessions, isLoading, isError, error } = useSessions(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading schedule…</p>;
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load your schedule')}
      </p>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        No evaluation sessions have been created for your group yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const when = formatSlot(session.scheduledStart, session.scheduledEnd);
        return (
          <div key={session.id} className="rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold text-gray-800">{session.stage.name}</p>
            <p className="mt-1 text-sm text-gray-600">{when ?? 'A time has not been set yet.'}</p>
            {session.location && <p className="text-xs text-gray-500">Venue: {session.location}</p>}
            {session.allocatedMinutes && (
              <p className="text-xs text-gray-500">Your slot is {session.allocatedMinutes} minutes.</p>
            )}
            <p className="mt-1 text-xs text-gray-400">{session.status.replace(/_/g, ' ').toLowerCase()}</p>
          </div>
        );
      })}
    </div>
  );
}
