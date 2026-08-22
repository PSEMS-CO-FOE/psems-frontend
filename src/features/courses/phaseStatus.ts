import type { CpiPhaseName, TimelinePhase } from './types';
import type { TabStatus } from '@/components/ui';

/** Phase windows are stored as dates, so compare on the day rather than the
 *  instant: a phase ending today is still open for the whole of today. */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function statusOfPhase(phase: TimelinePhase, today: string): TabStatus {
  if (today < dayOf(phase.startDate)) return 'upcoming';
  if (today > dayOf(phase.endDate)) return 'closed';
  return 'open';
}

/**
 * The status to show against a tab that covers `phases`. A tab is open if any
 * of its phases is; otherwise upcoming if any is still ahead. Returns undefined
 * when the course has enabled none of them — a tab with no phase behind it
 * gets no dot rather than a misleading one.
 */
export function statusOfPhases(
  timeline: TimelinePhase[] | undefined,
  phases: CpiPhaseName[],
  now: Date = new Date(),
): TabStatus | undefined {
  if (!timeline) return undefined;
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

  const statuses = timeline.filter((t) => phases.includes(t.phase)).map((t) => statusOfPhase(t, today));
  if (statuses.length === 0) return undefined;
  if (statuses.includes('open')) return 'open';
  if (statuses.includes('upcoming')) return 'upcoming';
  return 'closed';
}
