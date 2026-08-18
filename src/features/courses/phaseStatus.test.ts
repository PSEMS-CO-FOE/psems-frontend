import { describe, expect, it } from 'vitest';
import { statusOfPhases } from './phaseStatus';
import type { TimelinePhase } from './types';

function phase(name: TimelinePhase['phase'], start: string, end: string): TimelinePhase {
  return { id: name, phase: name, startDate: `${start}T00:00:00.000Z`, endDate: `${end}T00:00:00.000Z` };
}

const now = new Date('2026-08-16T09:00:00Z');

describe('statusOfPhases', () => {
  it('reports a phase spanning today as open', () => {
    const timeline = [phase('IDEA_ANNOUNCEMENT', '2026-08-10', '2026-08-20')];
    expect(statusOfPhases(timeline, ['IDEA_ANNOUNCEMENT'], now)).toBe('open');
  });

  it('counts the last day of a phase as still open', () => {
    // Windows are stored as dates, so a phase ending today has all of today
    // left — treating it as closed would shut people out a day early.
    const timeline = [phase('IDEA_ANNOUNCEMENT', '2026-08-10', '2026-08-16')];
    expect(statusOfPhases(timeline, ['IDEA_ANNOUNCEMENT'], now)).toBe('open');
  });

  it('distinguishes a finished phase from one not yet started', () => {
    const timeline = [
      phase('IDEA_ANNOUNCEMENT', '2026-07-01', '2026-07-10'),
      phase('PROJECT_SELECTION', '2026-09-01', '2026-09-10'),
    ];
    expect(statusOfPhases(timeline, ['IDEA_ANNOUNCEMENT'], now)).toBe('closed');
    expect(statusOfPhases(timeline, ['PROJECT_SELECTION'], now)).toBe('upcoming');
  });

  it('takes the most active status when a tab covers several phases', () => {
    const timeline = [
      phase('PROPOSAL_SUBMISSION', '2026-07-01', '2026-07-10'),
      phase('FINAL_SUBMISSION', '2026-08-10', '2026-08-20'),
    ];
    expect(statusOfPhases(timeline, ['PROPOSAL_SUBMISSION', 'FINAL_SUBMISSION'], now)).toBe('open');
  });

  it('gives no status when the course enabled none of the phases', () => {
    // A tab with no phase behind it gets no dot rather than a misleading one.
    expect(statusOfPhases([], ['IDEA_ANNOUNCEMENT'], now)).toBeUndefined();
    expect(statusOfPhases(undefined, ['IDEA_ANNOUNCEMENT'], now)).toBeUndefined();
  });
});
