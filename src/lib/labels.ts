/**
 * How the app says what the database stores. Enum values kept leaking onto the
 * screen one at a time — `FROM_SELECTION` beside a group's name, `ACCEPTED`
 * beside a member's — and each screen that noticed wrote its own map, so the
 * same value read differently in two places. One file, and a value nobody has
 * written a label for falls back to itself rather than rendering nothing.
 */
const say = <T extends string>(map: Record<string, string>) =>
  (value: T | null | undefined): string =>
    value == null ? '—' : (map[value] ?? value);

export const sessionStatusLabel = say({
  SCHEDULED: 'Scheduled',
  AWAITING_REVIEW: 'Awaiting review',
  CORRECTION_REQUESTED: 'Correction requested',
  FINALIZED: 'Finalized',
});

export const selectionStatusLabel = say({
  PENDING: 'Awaiting a response',
  ACCEPTED: 'Confirmed',
  DECLINED: 'Declined',
});

export const ideaAuthorLabel = say({
  COORDINATOR: 'Posted by the coordinator',
  SUPERVISOR: 'Posted by a supervisor',
  LECTURER: 'Posted by a lecturer',
  STUDENT: 'Posted by a student group',
});

/** The same thing in one or two words, where a whole sentence will not fit. */
export const ideaAuthorShort = say({
  COORDINATOR: 'Coordinator',
  SUPERVISOR: 'Supervisor',
  LECTURER: 'Lecturer',
  STUDENT: 'Student group',
});

export const ideaApprovalLabel = say({
  PENDING: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVISION_REQUESTED: 'Revision requested',
});

export const memberStatusLabel = say({
  ACCEPTED: 'Joined',
  PENDING: 'Invited, not yet answered',
  DECLINED: 'Declined',
});

export const allocationSourceLabel = say({
  FROM_SELECTION: "From the group's selection",
  COORDINATOR_OVERRIDE: 'Set by the coordinator',
});

export const courseStatusLabel = say({
  DRAFT: 'Draft',
  ACTIVE: 'Open',
  ARCHIVED: 'Archived',
});
