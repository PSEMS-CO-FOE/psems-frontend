import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AvailabilityGrid, AvailabilityLegend } from '@/components/AvailabilityGrid';
import {
  cellKey,
  useMyAvailability,
  useSubmitAvailability,
  type AvailabilityStatus,
} from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';

export function AvailabilityPage() {
  const { cpiId = '' } = useParams();
  const { data, isLoading } = useMyAvailability(cpiId);
  const submit = useSubmitAvailability(cpiId);

  // Changes are kept here and only sent on Save, so clicking a cell is not a request.
  const [values, setValues] = useState<Map<string, AvailabilityStatus>>(new Map());
  const [dirty, setDirty] = useState(false);

  const serverValues = useMemo(() => {
    const map = new Map<string, AvailabilityStatus>();
    for (const entry of data?.entries ?? []) {
      map.set(cellKey(entry.slotDate, entry.templateSlotId), entry.status);
    }
    return map;
  }, [data]);

  useEffect(() => {
    if (!dirty) setValues(serverValues);
  }, [serverValues, dirty]);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  if (!data?.template) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        The coordinator hasn't published an availability grid for this course yet.
      </p>
    );
  }

  const setCell = (slotDate: string, slotId: string, status: AvailabilityStatus | 'BLANK') => {
    setDirty(true);
    setValues((prev) => {
      const next = new Map(prev);
      if (status === 'BLANK') next.delete(cellKey(slotDate, slotId));
      else next.set(cellKey(slotDate, slotId), status);
      return next;
    });
  };

  const save = () => {
    const entries = [...values.entries()].map(([key, status]) => {
      const [slotDate, templateSlotId] = key.split('|');
      return { slotDate, templateSlotId, status };
    });
    submit.mutate(entries, { onSuccess: () => setDirty(false) });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">My availability</h2>
        <p className="mt-1 text-xs text-gray-500">
          Click a cell to cycle through free, maybe and busy.{' '}
          {data.required
            ? 'This course expects your availability.'
            : 'This course does not require your availability, but you can still record it.'}
        </p>
      </div>

      <AvailabilityLegend />

      <AvailabilityGrid
        template={data.template}
        values={values}
        onChange={(slotDate, slot, status) => setCell(slotDate, slot.id, status)}
      />

      {submit.isError && (
        <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700">{getApiErrorMessage(submit.error)}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={!dirty || submit.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submit.isPending ? '…' : 'Save availability'}
        </button>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        {!dirty && submit.isSuccess && <span className="text-xs text-green-600">Saved.</span>}
      </div>
    </div>
  );
}
