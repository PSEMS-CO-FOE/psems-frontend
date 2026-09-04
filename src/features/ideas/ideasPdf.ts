import type { Idea } from './useIdeas';
import { personName } from '@/lib/name';
import { ideaApprovalLabel, ideaAuthorShort } from '@/lib/labels';
import {
  MARGIN,
  TINT_FILL,
  finishSheet,
  newSheet,
  saveSheet,
  tableStyle,
  type SheetMeta,
} from '@/features/pdf/sheet';

function supervisorLine(idea: Idea): string {
  const rows = idea.supervisors ?? [];
  if (rows.length === 0) return '—';
  return rows
    .map((s) => {
      const who = personName(s.lecturer.user);
      const role = s.isPrimary ? 'supervisor' : 'co-supervisor';
      const state = s.invitationStatus === 'ACCEPTED' ? '' : ` (${s.invitationStatus.toLowerCase()})`;
      return `${who} — ${role}${state}`;
    })
    .join('\n');
}

/**
 * Every idea on the course with its full description, who posted it and who is
 * supervising. Portrait: the description is the point, so it needs the width.
 */
export async function buildIdeasSheetPdf(
  ideas: Idea[],
  course: { courseName: string; academicYear: string },
): Promise<{ doc: Awaited<ReturnType<typeof newSheet>>['doc']; meta: SheetMeta }> {
  const meta: SheetMeta = {
    ...course,
    documentName: 'Ideas',
    subtitle: `${ideas.length} idea${ideas.length === 1 ? '' : 's'}`,
  };

  const { doc, autoTable, startY } = await newSheet(meta, 'portrait');

  autoTable(doc, {
    ...tableStyle,
    startY,
    margin: { left: MARGIN.side, right: MARGIN.side, top: MARGIN.top, bottom: MARGIN.bottom },
    head: [['No', 'Title and description', 'Posted by', 'Supervision', 'Status']],
    body: ideas.map((idea, i) => [
      i + 1,
      // The full text, not a preview: a summary nobody can read the whole of
      // is the reason this document was asked for.
      `${idea.title}\n\n${idea.description}`,
      `${personName(idea.author)}\n${ideaAuthorShort(idea.authorType)}${
        idea.group ? `\n${idea.group.name}` : ''
      }`,
      supervisorLine(idea),
      ideaApprovalLabel(idea.approvalStatus),
    ]),
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 34 },
      3: { cellWidth: 36 },
      4: { cellWidth: 24 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index % 2 === 1) {
        data.cell.styles.fillColor = TINT_FILL;
      }
      // The title carries the row; the description reads as body text under it.
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontSize = 7.5;
      }
    },
  });

  finishSheet(doc, meta, 'portrait');
  return { doc, meta };
}

/** Split from the build so a layout can be generated and inspected outside a browser. */
export async function downloadIdeasSheet(ideas: Idea[],
  course: { courseName: string; academicYear: string },): Promise<void> {
  const { doc, meta } = await buildIdeasSheetPdf(ideas, course);
  saveSheet(doc, meta);
}
