import type { ScheduleSheet } from './useScheduling';
import {
  HEADER_FILL,
  INK,
  LINE,
  MARGIN,
  PAGE as PAGES,
  TINT_FILL,
  finishSheet,
  lastTableY,
  newSheet,
  saveSheet,
  type SheetMeta,
} from '@/features/pdf/sheet';

type Row = ScheduleSheet['rows'][number];

// Two group tables per band, as on the faculty's own lab sheets.
const PAGE = PAGES.landscape;
const GUTTER = 8;
const COLUMN = (PAGE.width - MARGIN.side * 2 - GUTTER) / 2;
const FIXED_COLS = { group: 20, no: 8, index: 26, when: 28 };
const NAME_W = COLUMN - (FIXED_COLS.group + FIXED_COLS.no + FIXED_COLS.index + FIXED_COLS.when);
const BODY_PT = 7.5;
const CELL_PAD = 1.2;
const BAND_GAP = 5;

const GROUP_FILL = TINT_FILL;

function slot(row: Row): string {
  if (!row.scheduledStart) return 'Not scheduled';
  const from = new Date(row.scheduledStart);
  const date = from.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const span = row.scheduledEnd ? `${time(from)} - ${time(new Date(row.scheduledEnd))}` : time(from);
  return `${date}\n${span}`;
}

/**
 * The schedule as a real document rather than whatever `window.print()` made of
 * the page. Loaded on demand: jsPDF is far larger than the screen that offers it.
 * Split from the save so the layout can be built and inspected without a browser.
 */
export async function buildScheduleSheetPdf(sheet: ScheduleSheet) {
  // Every row of a stage shares its name, so the sheet is titled by it when
  // only one stage is on the page.
  const stages = [...new Set(sheet.rows.map((r) => r.stageName))];
  const stageName = stages.length === 1 ? stages[0] : null;

  const meta: SheetMeta = {
    courseName: sheet.courseName,
    academicYear: sheet.academicYear,
    documentName: stageName ?? 'Schedule',
    subtitle: sheet.venue ? `@ ${sheet.venue}` : null,
  };

  const { doc, autoTable, startY: top } = await newSheet(meta, 'landscape');

  // Continuous across the sheet, as on the template — the backend numbers
  // within a group, which restarts at every table.
  let seq = 0;
  const numbered = sheet.rows.map((row) => ({
    row,
    members: row.members.map((m) => ({ ...m, no: ++seq })),
  }));

  // A table is measured before it is drawn, so page breaks are decided here
  // rather than by autoTable — which would move a table out from under the
  // band tracking and leave the two columns overlapping.
  const tableHeight = (members: { name: string }[]): number => {
    doc.setFont('helvetica', 'normal').setFontSize(BODY_PT);
    const lineHeight = (BODY_PT / 72) * 25.4 * 1.15;
    const rows = (members.length > 0 ? members : [{ name: 'No members' }]).reduce((h, m) => {
      const lines = Math.max(1, doc.splitTextToSize(m.name, NAME_W - CELL_PAD * 2).length);
      return h + lines * lineHeight + CELL_PAD * 2;
    }, 0);
    return lineHeight + CELL_PAD * 2 + rows;
  };

  // Left and right fill independently; a band ends at the taller of the two,
  // which is what keeps the pairs aligned down the page.
  let column: 0 | 1 = 0;
  let bandTop = top;
  let bandBottom = top;

  for (const { row, members } of numbered) {
    if (bandTop + tableHeight(members) > PAGE.height - MARGIN.bottom) {
      doc.addPage();
      bandTop = MARGIN.top;
      bandBottom = MARGIN.top;
      column = 0;
    }

    const left = MARGIN.side + column * (COLUMN + GUTTER);

    autoTable(doc, {
      startY: bandTop,
      margin: { left, right: PAGE.width - left - COLUMN, top: MARGIN.top, bottom: MARGIN.bottom },
      tableWidth: COLUMN,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: BODY_PT,
        cellPadding: CELL_PAD,
        lineColor: LINE,
        lineWidth: 0.15,
        textColor: INK,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: { fillColor: HEADER_FILL, textColor: INK, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: FIXED_COLS.group, fillColor: GROUP_FILL, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: FIXED_COLS.no, halign: 'center' },
        2: { cellWidth: FIXED_COLS.index, halign: 'center' },
        3: { cellWidth: NAME_W },
        4: { cellWidth: FIXED_COLS.when, halign: 'center', fontStyle: 'bold' },
      },
      head: [['Group', 'No', 'Index Number', 'Name', 'Date & Time']],
      body:
        members.length > 0
          ? members.map((m, i) =>
              i === 0
                ? [
                    { content: row.groupName, rowSpan: members.length },
                    m.no,
                    m.indexNumber,
                    m.name,
                    { content: slot(row), rowSpan: members.length },
                  ]
                : [m.no, m.indexNumber, m.name],
            )
          : [[row.groupName, '', '', 'No members', slot(row)]],
    });

    bandBottom = Math.max(bandBottom, lastTableY(doc));

    if (column === 1) {
      bandTop = bandBottom + BAND_GAP;
      column = 0;
    } else {
      column = 1;
    }
  }

  finishSheet(doc, meta, 'landscape');

  return { doc, meta };
}

export async function downloadScheduleSheet(sheet: ScheduleSheet): Promise<void> {
  const { doc, meta } = await buildScheduleSheetPdf(sheet);
  saveSheet(doc, meta);
}
