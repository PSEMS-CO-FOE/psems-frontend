import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSubmitAvailability } from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';

export function AvailabilityPage() {
  const { cpiId = '' } = useParams();
  const submit = useSubmitAvailability(cpiId);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Submit an availability slot</h2>
      <p className="mt-1 text-xs text-gray-500">
        Only open during the Availability Submission phase.
      </p>

      {submit.isError && (
        <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {getApiErrorMessage(submit.error)}
        </p>
      )}
      {submit.isSuccess && (
        <p className="mt-2 rounded bg-green-50 px-3 py-2 text-xs text-green-700">Slot submitted.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-gray-500">
          start
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="ml-1 rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </label>
        <label className="text-xs text-gray-500">
          end
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="ml-1 rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </label>
        <button
          onClick={() =>
            submit.mutate(
              { slotStart: new Date(start).toISOString(), slotEnd: new Date(end).toISOString() },
              { onSuccess: () => { setStart(''); setEnd(''); } },
            )
          }
          disabled={!start || !end || submit.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submit.isPending ? '…' : 'Submit slot'}
        </button>
      </div>
    </div>
  );
}
