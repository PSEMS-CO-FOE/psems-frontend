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
import { Button, Card, EmptyState, Notice, SkeletonCard } from '@/components/ui';

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

  if (isLoading) return <SkeletonCard rows={3} />;

  if (!data?.template) {
    return (
      <EmptyState
        title="No availability grid yet"
        hint="Your coordinator publishes the grid before asking for availability. You will be notified when it opens."
      />
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
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">My availability</h2>
        <p className="mt-1 text-xs text-ink-muted">
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
        <Notice tone="critical" size="xs">{getApiErrorMessage(submit.error)}</Notice>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm"
          onClick={save}
          disabled={!dirty || submit.isPending}>
          {submit.isPending ? '…' : 'Save availability'}
        </Button>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        {!dirty && submit.isSuccess && <span className="text-xs text-positive-700">Saved.</span>}
      </div>
    </Card>
  );
}
