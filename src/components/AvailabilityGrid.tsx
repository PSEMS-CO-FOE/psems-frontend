import { useRef } from 'react';
import {
  cellKey,
  type AvailabilityStatus,
  type AvailabilityTemplate,
  type AvailabilityTemplateSlot,
} from '@/features/scheduling/useScheduling';

const STATUS_STYLES: Record<AvailabilityStatus | 'BLANK', string> = {
  AVAILABLE: 'bg-positive-50 text-positive-700 border-positive-500/40',
  TENTATIVE: 'bg-caution-50 text-caution-700 border-caution-500/40',
  UNAVAILABLE: 'bg-critical-50 text-critical-700 border-critical-500/40',
  BLANK: 'bg-surface text-ink-subtle border-line',
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
  const cells = useRef(new Map<string, HTMLButtonElement | null>());

  // A fortnight-wide grid is 40-odd cells; reaching the far corner one Tab at a
  // time is why this exists. Every cell stays tabbable, so Tab still escapes the
  // grid — the arrows are an addition, not a roving-tabindex replacement.
  const onCellKeyDown = (event: React.KeyboardEvent, row: number, col: number) => {
    const lastRow = template.slots.length - 1;
    const lastCol = template.dates.length - 1;
    let [r, c] = [row, col];

    switch (event.key) {
      case 'ArrowUp': r = Math.max(0, row - 1); break;
      case 'ArrowDown': r = Math.min(lastRow, row + 1); break;
      case 'ArrowLeft': c = Math.max(0, col - 1); break;
      case 'ArrowRight': c = Math.min(lastCol, col + 1); break;
      case 'Home': c = 0; break;
      case 'End': c = lastCol; break;
      default: return;
    }

    event.preventDefault();
    cells.current.get(`${r}:${c}`)?.focus();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-surface px-2 py-1 text-left font-medium text-ink-muted">Slot</th>
            {template.dates.map((date) => (
              <th key={date} className="px-2 py-1 font-medium text-ink-muted">
                {shortDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {template.slots.map((slot, rowIndex) => (
            <tr key={slot.id}>
              <th className="sticky left-0 bg-surface px-2 py-1 text-left font-medium text-ink-muted">
                {slot.name}
                <span className="ml-1 font-normal text-ink-subtle">
                  {slot.startTime}–{slot.endTime}
                </span>
              </th>
              {template.dates.map((date, colIndex) => {
                if (summary) {
                  const { available, tentative, total } = summary(date, slot);
                  return (
                    <td key={date} className="px-1 py-0.5 text-center">
                      <div
                        className={`rounded-control border px-2 py-1 ${
                          available > 0 ? STATUS_STYLES.AVAILABLE : tentative > 0 ? STATUS_STYLES.TENTATIVE : STATUS_STYLES.BLANK
                        }`}
                        title={`${available} free, ${tentative} maybe, of ${total} who answered`}
                      >
                        {available}
                        {tentative > 0 && <span className="text-caution-700"> +{tentative}</span>}
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
                      ref={(el) => {
                        cells.current.set(`${rowIndex}:${colIndex}`, el);
                      }}
                      onClick={() => onChange?.(date, slot, nextStatus(status))}
                      onKeyDown={(e) => onCellKeyDown(e, rowIndex, colIndex)}
                      // The visible label is only the status, so on its own it
                      // reads as "Free, Free, Busy" with no idea which cell.
                      aria-label={`${shortDate(date)}, ${slot.name}: ${STATUS_LABELS[status]}`}
                      className={`w-full rounded-control border px-2 py-1 ${STATUS_STYLES[status]} ${
                        readOnly ? '' : 'hover:opacity-80'
                      }`}
                    >
                      <span aria-hidden="true">{STATUS_LABELS[status]}</span>
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
    <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
      {(['AVAILABLE', 'TENTATIVE', 'UNAVAILABLE', 'BLANK'] as const).map((status) => (
        <span key={status} className={`rounded-control border px-2 py-0.5 ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
          {status === 'BLANK' && ' not answered'}
        </span>
      ))}
    </div>
  );
}
