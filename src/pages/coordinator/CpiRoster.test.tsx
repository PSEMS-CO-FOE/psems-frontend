import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CpiRoster } from './CpiRoster';
import type { JoinRequest, Roster } from '@/features/courses/useCourseAccess';

const CPI = 'cpi-1';

// Seeding the cache rather than mocking transport: the component's job is to
// render a roster, not to fetch one.
function renderWith(roster: Roster, requests: JoinRequest[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['courses', CPI, 'roster'], roster);
  client.setQueryData(['courses', CPI, 'join-requests'], requests);
  return render(
    <QueryClientProvider client={client}>
      <CpiRoster cpiId={CPI} />
    </QueryClientProvider>,
  );
}

const baseRoster: Roster = {
  batch: '22ENG',
  targetGroupSize: 4,
  total: 3,
  inGroups: 1,
  alone: 1,
  notStarted: 1,
  rows: [
    {
      studentId: 's1',
      indexNumber: 'EN001',
      name: 'Anura Perera',
      group: { id: 'g1', name: 'Group A', size: 4 },
      working: 'IN_GROUP',
      offTarget: false,
    },
    {
      studentId: 's2',
      indexNumber: 'EN002',
      name: 'Chamari Silva',
      group: { id: 'g2', name: 'Group B', size: 1 },
      working: 'ALONE',
      offTarget: true,
    },
    {
      studentId: 's3',
      indexNumber: 'EN003',
      name: 'Nuwan Fernando',
      group: null,
      working: 'NOT_STARTED',
      offTarget: false,
    },
  ],
};

// The label sits in a flex row inside the tile, so the tile itself is two
// levels up from the label's own paragraph.
function tile(label: string) {
  return screen.getByText(label).parentElement!.parentElement!;
}

describe('CpiRoster', () => {
  it('separates grouped, alone and not started', () => {
    renderWith(baseRoster);

    expect(within(tile('In groups')).getByText('1')).toBeInTheDocument();
    expect(within(tile('Students')).getByText('3')).toBeInTheDocument();

    // The three states also read on the rows themselves.
    expect(screen.getByText('In a group')).toBeInTheDocument();
    expect(screen.getAllByText('Working alone').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0);
  });

  it('names every student in the batch, including one who has not started', () => {
    renderWith(baseRoster);

    // The student with no group is the whole point: they are invisible to
    // allocation, sessions and marks, and this is the only place they appear.
    expect(screen.getByText('Nuwan Fernando')).toBeInTheDocument();
    expect(screen.getByText('EN003')).toBeInTheDocument();
  });

  it('flags a group that is not the size the coordinator asked for', () => {
    renderWith(baseRoster);
    expect(screen.getByText('not 4')).toBeInTheDocument();
  });

  it('says the batch is wrong when nobody matches it', () => {
    renderWith({ ...baseRoster, total: 0, inGroups: 0, alone: 0, notStarted: 0, rows: [] });

    // A roster of zero is how a mistyped batch surfaces — students would
    // otherwise just see nothing and assume the course was not ready.
    expect(screen.getByText(/No students are in 22ENG/)).toBeInTheDocument();
  });

  it('shows a pending join request with the student’s own batch', () => {
    renderWith(baseRoster, [
      {
        id: 'r1',
        reason: 'Repeating after last year',
        status: 'PENDING',
        createdAt: '2026-08-01T00:00:00.000Z',
        decidedAt: null,
        student: {
          id: 's9',
          studentId: 'EN900',
          batch: '21ENG',
          user: { fullName: 'Repeat Student', email: 'r@psems.dev' },
        },
      },
    ]);

    expect(screen.getByText('Repeating after last year')).toBeInTheDocument();
    expect(screen.getByText('21ENG')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to course/i })).toBeInTheDocument();
  });
});
