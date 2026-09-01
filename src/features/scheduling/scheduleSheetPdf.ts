import type { ScheduleSheet } from './useScheduling';

type Row = ScheduleSheet['rows'][number];

// Two group tables per band, as on the faculty's own lab sheets. A4 landscape
// in millimetres.
const PAGE = { width: 297, height: 210 };
const MARGIN = { top: 14, bottom: 14, side: 12 };
const GUTTER = 8;
const COLUMN = (PAGE.width - MARGIN.side * 2 - GUTTER) / 2;
const FIXED_COLS = { group: 20, no: 8, index: 26, when: 28 };
const NAME_W = COLUMN - (FIXED_COLS.group + FIXED_COLS.no + FIXED_COLS.index + FIXED_COLS.when);
const BODY_PT = 7.5;
const CELL_PAD = 1.2;
const BAND_GAP = 5;

const HEADER_FILL: [number, number, number] = [220, 243, 228];
const GROUP_FILL: [number, number, number] = [240, 247, 242];
const INK: [number, number, number] = [21, 28, 24];
const LINE: [number, number, number] = [160, 178, 166];

function slot(row: Row): string {
  if (!row.scheduledStart) return 'Not scheduled';
  const from = new Date(row.scheduledStart);
  const date = from.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const span = row.scheduledEnd ? `${time(from)} - ${time(new Date(row.scheduledEnd))}` : time(from);
  return `${date}\n${span}`;
}

function fileName(sheet: ScheduleSheet, stageName: string | null): string {
  const parts = [sheet.courseName, stageName ?? 'Schedule', sheet.academicYear];
  return `${parts.filter(Boolean).join('_').replace(/[^\w.-]+/g, '_')}.pdf`;
}

/**
 * The schedule as a real document rather than whatever `window.print()` made of
 * the page. Loaded on demand: jsPDF is far larger than the screen that offers it.
 * Split from the save so the layout can be built and inspected without a browser.
 */
export async function buildScheduleSheetPdf(sheet: ScheduleSheet) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Every row of a stage shares its name, so the sheet is titled by it when
  // only one stage is on the page.
  const stages = [...new Set(sheet.rows.map((r) => r.stageName))];
  const stageName = stages.length === 1 ? stages[0] : null;

  // Continuous across the sheet, as on the template — the backend numbers
  // within a group, which restarts at every table.
  let seq = 0;
  const numbered = sheet.rows.map((row) => ({
    row,
    members: row.members.map((m) => ({ ...m, no: ++seq })),
  }));

  const title = () => {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold').setFontSize(12);
    doc.text(sheet.courseName, PAGE.width / 2, MARGIN.top + 4, { align: 'center' });

    doc.setFontSize(10);
    let y = MARGIN.top + 10;
    if (stageName) {
      doc.text(stageName, PAGE.width / 2, y, { align: 'center' });
      y += 5;
    }
    doc.setFont('helvetica', 'normal').setFontSize(9);
    const place = sheet.venue ? `@ ${sheet.venue}` : null;
    const line = [place, sheet.academicYear].filter(Boolean).join('  ·  ');
    if (line) {
      doc.text(line, PAGE.width / 2, y, { align: 'center' });
      y += 5;
    }
    return y + 3;
  };

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

  const top = title();
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

    bandBottom = Math.max(
      bandBottom,
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
    );

    if (column === 1) {
      bandTop = bandBottom + BAND_GAP;
      column = 0;
    } else {
      column = 1;
    }
  }

  // Running header and footer, added last so the page count is known.
  const pages = doc.getNumberOfPages();
  const printed = new Date().toLocaleDateString();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(120, 134, 126);
    doc.text(sheet.courseName, MARGIN.side, MARGIN.top - 6);
    doc.text(stageName ?? 'Schedule', PAGE.width - MARGIN.side, MARGIN.top - 6, { align: 'right' });
    doc.text(printed, MARGIN.side, PAGE.height - 7);
    doc.text(`Page ${page} of ${pages}`, PAGE.width - MARGIN.side, PAGE.height - 7, { align: 'right' });
  }

  return { doc, fileName: fileName(sheet, stageName) };
}

export async function downloadScheduleSheet(sheet: ScheduleSheet): Promise<void> {
  const { doc, fileName: name } = await buildScheduleSheetPdf(sheet);
  doc.save(name);
}
