import type { MarkSheet } from './useMarks';
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

const pct = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100) / 100}`);

/**
 * The continuous-assessment sheet as a document: one row per student, one
 * column per stage, then the total and the grade. Landscape, because a course
 * with four stages plus name, index and group does not fit portrait.
 */
export async function buildMarksSheetPdf(sheet: MarkSheet): Promise<{ doc: Awaited<ReturnType<typeof newSheet>>['doc']; meta: SheetMeta }> {
  const meta: SheetMeta = {
    courseName: sheet.courseName,
    academicYear: sheet.academicYear,
    documentName: 'Mark sheet',
    subtitle: `${sheet.rows.length} student${sheet.rows.length === 1 ? '' : 's'}`,
  };

  const { doc, autoTable, page, startY } = await newSheet(meta, 'landscape');
  const showsGrade = sheet.gradingEnabled && sheet.rows.some((r) => r.grade !== null);

  const head = [
    'No',
    'Index Number',
    'Name',
    'Group',
    ...sheet.stages.map((s) => `${s.name}\n(${s.weight}%)`),
    'Total',
    ...(showsGrade ? ['Grade'] : []),
  ];

  autoTable(doc, {
    ...tableStyle,
    startY,
    margin: { left: MARGIN.side, right: MARGIN.side, top: MARGIN.top, bottom: MARGIN.bottom },
    head: [head],
    body: sheet.rows.map((row, i) => [
      i + 1,
      row.indexNumber,
      // As the faculty writes it: surname then initials.
      `${row.surname.toUpperCase()} ${row.initials}`.trim(),
      row.groupName,
      ...sheet.stages.map((s) => pct(row.stagePercents[s.id] ?? null)),
      pct(row.total),
      ...(showsGrade ? [row.grade ?? '—'] : []),
    ]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 30 },
    },
    // A student who was never scored, or who is under the pass mark, is the
    // reason this sheet is read at all — so the row says so rather than
    // leaving it to be spotted in a column of numbers.
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const row = sheet.rows[data.row.index];
      if (row.zeroTotal || row.belowPassMark) data.cell.styles.fillColor = FLAG_FILL;
      else if (data.row.index % 2 === 1) data.cell.styles.fillColor = TINT_FILL;
    },
  });

  let y = lastTableY(doc) + 6;
  doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);

  const notes = [
    sheet.passMarkPercent !== null
      ? `Shaded: no marks recorded, or below the ${sheet.passMarkPercent}% pass mark (${sheet.belowPassMark} student${sheet.belowPassMark === 1 ? '' : 's'}).`
      : `Shaded: no marks recorded (${sheet.flagged} student${sheet.flagged === 1 ? '' : 's'}).`,
    sheet.caContributionPercent !== null
      ? `This course contributes ${sheet.caContributionPercent}% of the module.`
      : null,
    'Stage columns are percentages. The total is the weighted sum of the stages.',
  ].filter((n): n is string => n !== null);

  for (const note of notes) {
    if (y > page.height - MARGIN.bottom - 4) {
      doc.addPage();
      y = MARGIN.top;
    }
    doc.text(note, MARGIN.side, y);
    y += 4;
  }

  finishSheet(doc, meta, 'landscape');
  return { doc, meta };
}

/** Split from the build so a layout can be generated and inspected outside a browser. */
export async function downloadMarksSheet(sheet: MarkSheet): Promise<void> {
  const { doc, meta } = await buildMarksSheetPdf(sheet);
  saveSheet(doc, meta);
}
