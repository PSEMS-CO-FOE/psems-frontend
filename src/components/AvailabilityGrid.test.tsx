import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AvailabilityGrid } from './AvailabilityGrid';
import { cellKey, type AvailabilityStatus, type AvailabilityTemplate } from '@/features/scheduling/useScheduling';

const template: AvailabilityTemplate = {
  id: 't1',
  windowStart: '2026-09-01',
  windowEnd: '2026-09-02',
  dates: ['2026-09-01', '2026-09-02'],
  slots: [
    { id: 'morning', name: 'Morning', startTime: '09:00', endTime: '12:00', orderIndex: 0 },
    { id: 'afternoon', name: 'Afternoon', startTime: '13:00', endTime: '17:00', orderIndex: 1 },
  ],
};

// The page keeps cell state itself, so the test does the same rather than
// asserting against a component that cannot change on its own.
function Harness({ onChangeSpy }: { onChangeSpy?: (key: string, status: string) => void }) {
  const [values, setValues] = useState<Map<string, AvailabilityStatus>>(new Map());
  return (
    <AvailabilityGrid
      template={template}
      values={values}
      onChange={(slotDate, slot, status) => {
        onChangeSpy?.(cellKey(slotDate, slot.id), status);
        setValues((prev) => {
          const next = new Map(prev);
          if (status === 'BLANK') next.delete(cellKey(slotDate, slot.id));
          else next.set(cellKey(slotDate, slot.id), status);
          return next;
        });
      }}
    />
  );
}

function cell(rowName: string, columnIndex: number) {
  const row = screen.getByRole('row', { name: new RegExp(rowName) });
  return within(row).getAllByRole('button')[columnIndex];
}

describe('AvailabilityGrid', () => {
  it('draws a column per date and a row per slot', () => {
    render(<Harness />);
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
    // Two slots across two dates.
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('cycles a cell through free, maybe and busy, then back to blank', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(cell('Morning', 0)).toHaveTextContent('–');
    await user.click(cell('Morning', 0));
    expect(cell('Morning', 0)).toHaveTextContent('Free');
    await user.click(cell('Morning', 0));
    expect(cell('Morning', 0)).toHaveTextContent('Maybe');
    await user.click(cell('Morning', 0));
    expect(cell('Morning', 0)).toHaveTextContent('Busy');
    // Back to blank, which is how a lecturer clears an answer.
    await user.click(cell('Morning', 0));
    expect(cell('Morning', 0)).toHaveTextContent('–');
  });

  it('changes only the cell that was clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(cell('Morning', 0));
    expect(cell('Morning', 0)).toHaveTextContent('Free');
    expect(cell('Morning', 1)).toHaveTextContent('–');
    expect(cell('Afternoon', 0)).toHaveTextContent('–');
  });

  it('reports the date and slot that changed', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Harness onChangeSpy={spy} />);

    await user.click(cell('Afternoon', 1));
    expect(spy).toHaveBeenCalledWith('2026-09-02|afternoon', 'AVAILABLE');
  });

  it('does not respond to clicks when read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AvailabilityGrid template={template} values={new Map()} onChange={onChange} readOnly />);

    await user.click(screen.getAllByRole('button')[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows counts instead of one answer in summary mode', () => {
    render(
      <AvailabilityGrid
        template={template}
        values={new Map()}
        summary={(slotDate, slot) =>
          slotDate === '2026-09-01' && slot.id === 'morning'
            ? { available: 3, tentative: 1, total: 5 }
            : { available: 0, tentative: 0, total: 0 }
        }
      />,
    );

    expect(screen.getByTitle('3 free, 1 maybe, of 5 who answered')).toHaveTextContent('3 +1');
  });
});
