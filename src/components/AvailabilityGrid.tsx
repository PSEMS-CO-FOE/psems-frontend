import {
  cellKey,
  type AvailabilityStatus,
  type AvailabilityTemplate,
  type AvailabilityTemplateSlot,
} from '@/features/scheduling/useScheduling';

const STATUS_STYLES: Record<AvailabilityStatus | 'BLANK', string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-300',
  TENTATIVE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  UNAVAILABLE: 'bg-red-100 text-red-800 border-red-300',
  BLANK: 'bg-white text-gray-300 border-gray-200',
};

const STATUS_LABELS: Record<AvailabilityStatus | 'BLANK', string> = {
  AVAILABLE: 'Free',
  TENTATIVE: 'Maybe',
  UNAVAILABLE: 'Busy',
  BLANK: '–',
};

// Clicking moves to the next choice. A dropdown in every cell would be far too
// slow to fill in a whole grid.
const CYCLE: (AvailabilityStatus | 'BLANK')[] = ['BLANK', 'AVAILABLE', 'TENTATIVE', 'UNAVAILABLE'];

function nextStatus(current: AvailabilityStatus | 'BLANK'): AvailabilityStatus | 'BLANK' {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

interface Props {
  template: AvailabilityTemplate;
  values: Map<string, AvailabilityStatus>;
  onChange?: (slotDate: string, slot: AvailabilityTemplateSlot, status: AvailabilityStatus | 'BLANK') => void;
  readOnly?: boolean;
  // Coordinator view: shows how many people picked each cell, not one answer.
  summary?: (slotDate: string, slot: AvailabilityTemplateSlot) => { available: number; tentative: number; total: number };
}

export function AvailabilityGrid({ template, values, onChange, readOnly, summary }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-2 py-1 text-left font-medium text-gray-500">Slot</th>
            {template.dates.map((date) => (
              <th key={date} className="px-2 py-1 font-medium text-gray-500">
                {shortDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {template.slots.map((slot) => (
            <tr key={slot.id}>
              <th className="sticky left-0 bg-white px-2 py-1 text-left font-medium text-gray-600">
                {slot.name}
                <span className="ml-1 font-normal text-gray-400">
                  {slot.startTime}–{slot.endTime}
                </span>
              </th>
              {template.dates.map((date) => {
                if (summary) {
                  const { available, tentative, total } = summary(date, slot);
                  return (
                    <td key={date} className="px-1 py-0.5 text-center">
                      <div
                        className={`rounded border px-2 py-1 ${
                          available > 0 ? STATUS_STYLES.AVAILABLE : tentative > 0 ? STATUS_STYLES.TENTATIVE : STATUS_STYLES.BLANK
                        }`}
                        title={`${available} free, ${tentative} maybe, of ${total} who answered`}
                      >
                        {available}
                        {tentative > 0 && <span className="text-yellow-700"> +{tentative}</span>}
                      </div>
                    </td>
                  );
                }

                const status = values.get(cellKey(date, slot.id)) ?? 'BLANK';
                return (
                  <td key={date} className="px-1 py-0.5 text-center">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onChange?.(date, slot, nextStatus(status))}
                      className={`w-full rounded border px-2 py-1 ${STATUS_STYLES[status]} ${
                        readOnly ? '' : 'hover:opacity-80'
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
      {(['AVAILABLE', 'TENTATIVE', 'UNAVAILABLE', 'BLANK'] as const).map((status) => (
        <span key={status} className={`rounded border px-2 py-0.5 ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
          {status === 'BLANK' && ' not answered'}
        </span>
      ))}
    </div>
  );
}
