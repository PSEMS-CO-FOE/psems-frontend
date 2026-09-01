import { useState } from 'react';
import { useScheduleSheet } from '@/features/scheduling/useScheduling';
import { downloadScheduleSheet } from '@/features/scheduling/scheduleSheetPdf';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, SkeletonText } from '@/components/ui';

function formatSlot(start: string | null, end: string | null) {
  if (!start || !end) return 'Not scheduled';
  const from = new Date(start);
  const to = new Date(end);
  const date = from.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time(from)} – ${time(to)}`;
}

export function ScheduleSheetPanel({ cpiId }: { cpiId: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const { data, isLoading, isError, error } = useScheduleSheet(cpiId, open);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setFailed(false);
    try {
      await downloadScheduleSheet(data);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t pt-3">
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen((v) => !v)} className="rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400">
          {open ? 'Hide the schedule' : 'Schedule sheet'}
        </button>
        {open && data && (
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Preparing…' : 'Download PDF'}
          </Button>
        )}
      </div>

      {failed && (
        <p className="mt-2 text-xs text-critical-700">
          The PDF could not be built. Try again, or reload the page.
        </p>
      )}

      {open && isLoading && <SkeletonText className="mt-2" />}
      {open && isError && <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(error)}</p>}

      {open && data && (
        <div className="mt-2 space-y-3 rounded-control border p-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {data.courseName} <span className="font-normal text-ink-muted">· {data.academicYear}</span>
            </p>
            {data.venue && <p className="text-xs text-ink-muted">Venue: {data.venue}</p>}
            {data.unscheduled > 0 && (
              <p className="text-xs text-caution-700">{data.unscheduled} session(s) still have no time set.</p>
            )}
          </div>

          {data.rows.map((row, i) => (
            <div key={i} className="break-inside-avoid">
              <p className="text-xs font-semibold text-ink">
                {row.groupName} · {row.stageName}
              </p>
              <p className="text-xs text-ink-muted">
                {formatSlot(row.scheduledStart, row.scheduledEnd)}
                {row.location && ` · ${row.location}`}
              </p>
              <table className="mt-1 text-xs">
                <thead>
                  <tr className="text-left text-ink-muted">
                    <th className="pr-4 font-medium">No</th>
                    <th className="pr-4 font-medium">Index Number</th>
                    <th className="font-medium">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {row.members.map((m) => (
                    <tr key={m.indexNumber} className="text-ink">
                      <td className="pr-4">{m.no}</td>
                      <td className="pr-4">{m.indexNumber}</td>
                      <td>{m.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
