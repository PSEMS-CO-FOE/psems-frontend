import type { AllocationMap } from './useAllocation';
import { personName } from '@/lib/name';
import {
  FLAG_FILL,
  MARGIN,
  MUTED,
  TINT_FILL,
  finishSheet,
  lastTableY,
  newSheet,
  saveSheet,
  tableStyle,
  type SheetMeta,
} from '@/features/pdf/sheet';

const SOURCE: Record<string, string> = {
  FROM_SELECTION: "From the group's selection",
  COORDINATOR_OVERRIDE: 'Set by the coordinator',
};

type Entry = AllocationMap['allocations'][number];

// The supervisor of record plus anyone co-supervising, and whether they have
// actually accepted — a pending co-supervisor is not yet supervising anyone.
function supervisionLine(a: Entry): string {
  const named = a.idea.supervisors ?? [];
  if (named.length > 0) {
    return named
      .map((s) => {
        const role = s.isPrimary ? 'supervisor' : 'co-supervisor';
        const state = s.invitationStatus === 'ACCEPTED' ? '' : ` (${s.invitationStatus.toLowerCase()})`;
        return `${personName(s.lecturer.user)} — ${role}${state}`;
      })
      .join('\n');
  }
  return a.supervisor ? `${personName(a.supervisor.user)} — supervisor` : 'Not assigned';
}

/**
 * Who is working on what, and with whom. The record a coordinator hands over or
 * files at the end of the allocation phase.
 */
export async function buildAllocationSheetPdf(
  map: AllocationMap,
  course: { courseName: string; academicYear: string },
): Promise<{ doc: Awaited<ReturnType<typeof newSheet>>['doc']; meta: SheetMeta }> {
  const meta: SheetMeta = {
    ...course,
    documentName: 'Allocation',
    subtitle: map.finalized ? 'Finalized' : 'Draft — not yet finalized',
  };

  const { doc, autoTable, startY } = await newSheet(meta, 'landscape');

  autoTable(doc, {
    ...tableStyle,
    startY,
    margin: { left: MARGIN.side, right: MARGIN.side, top: MARGIN.top, bottom: MARGIN.bottom },
    head: [['No', 'Group and members', 'Project', 'Supervision', 'How it was decided']],
    body: map.allocations.map((a, i) => [
      i + 1,
      [
        a.group.name,
        ...a.group.members.map(
          (m) => `${m.student.studentId}  ${personName(m.student.user)}`,
        ),
      ].join('\n'),
      a.idea.title,
      supervisionLine(a),
      SOURCE[a.source] ?? a.source,
    ]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 56 },
      3: { cellWidth: 58 },
      4: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      // A group with no supervisor is the row that still needs a decision.
      if (map.allocations[data.row.index]?.supervisor === null) {
        data.cell.styles.fillColor = FLAG_FILL;
      } else if (data.row.index % 2 === 1) {
        data.cell.styles.fillColor = TINT_FILL;
      }
    },
  });

  let y = lastTableY(doc) + 8;

  // What is still outstanding belongs on the same page as what is settled.
  const leftovers: { title: string; items: string[] }[] = [
    { title: 'Groups with no project', items: map.unmatchedGroups.map((g) => g.name) },
    { title: 'Ideas no group took', items: map.unmatchedSupervisorIdeas.map((i) => i.title) },
  ].filter((section) => section.items.length > 0);

  for (const section of leftovers) {
    autoTable(doc, {
      ...tableStyle,
      startY: y,
      margin: { left: MARGIN.side, right: MARGIN.side, top: MARGIN.top, bottom: MARGIN.bottom },
      head: [[`${section.title} (${section.items.length})`]],
      body: section.items.map((item) => [item]),
      tableWidth: 110,
    });
    y = lastTableY(doc) + 6;
  }

  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
  doc.text(
    map.finalized
      ? 'Allocations are finalized. Changes need the coordinator to reopen them.'
      : 'Draft: these allocations are not final and may still change.',
    MARGIN.side,
    y,
  );

  finishSheet(doc, meta, 'landscape');
  return { doc, meta };
}

/** Split from the build so a layout can be generated and inspected outside a browser. */
export async function downloadAllocationSheet(map: AllocationMap,
  course: { courseName: string; academicYear: string },): Promise<void> {
  const { doc, meta } = await buildAllocationSheetPdf(map, course);
  saveSheet(doc, meta);
}
