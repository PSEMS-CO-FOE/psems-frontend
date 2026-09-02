import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';

// One look for every document PSEMS produces, so a mark sheet and a schedule
// read as coming from the same system. Millimetres, to match A4.
export const PAGE = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
} as const;

export const MARGIN = { top: 14, bottom: 14, side: 12 } as const;

type Rgb = [number, number, number];

export const HEADER_FILL: Rgb = [220, 243, 228];
export const TINT_FILL: Rgb = [240, 247, 242];
export const FLAG_FILL: Rgb = [252, 234, 232];
export const INK: Rgb = [21, 28, 24];
export const LINE: Rgb = [160, 178, 166];
export const MUTED: Rgb = [120, 134, 126];

export type Orientation = keyof typeof PAGE;

export interface SheetMeta {
  courseName: string;
  academicYear: string;
  /** Names the document, in the running header and the filename. */
  documentName: string;
  /** An optional line under the title — a stage, a venue, a count. */
  subtitle?: string | null;
}

/** The shared table styling. Spread it, then override what a report needs. */
export const tableStyle: UserOptions = {
  theme: 'grid',
  styles: {
    font: 'helvetica',
    fontSize: 8,
    cellPadding: 1.4,
    lineColor: LINE,
    lineWidth: 0.15,
    textColor: INK,
    valign: 'middle',
    overflow: 'linebreak',
  },
  headStyles: { fillColor: HEADER_FILL, textColor: INK, fontStyle: 'bold', halign: 'left' },
};

function drawTitle(doc: jsPDF, meta: SheetMeta, width: number): number {
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold').setFontSize(12);
  doc.text(meta.courseName, width / 2, MARGIN.top + 4, { align: 'center' });

  doc.setFontSize(10);
  let y = MARGIN.top + 10;
  doc.text(meta.documentName, width / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal').setFontSize(9);
  const line = [meta.subtitle, meta.academicYear].filter(Boolean).join('  ·  ');
  if (line) {
    doc.text(line, width / 2, y, { align: 'center' });
    y += 5;
  }
  return y + 3;
}

/**
 * Opens a document and returns everything a report needs to lay itself out.
 * jsPDF is loaded on demand — it is far larger than the screen offering it.
 */
export async function newSheet(meta: SheetMeta, orientation: Orientation = 'portrait') {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const page = PAGE[orientation];
  return { doc, autoTable, page, startY: drawTitle(doc, meta, page.width) };
}

/** Where the table just drawn ended. autoTable records it on the document. */
export function lastTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/** Running header and footer. Added last, so the page count is known. */
export function finishSheet(doc: jsPDF, meta: SheetMeta, orientation: Orientation = 'portrait') {
  const page = PAGE[orientation];
  const pages = doc.getNumberOfPages();
  const printed = new Date().toLocaleDateString();

  for (let n = 1; n <= pages; n += 1) {
    doc.setPage(n);
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
    doc.text(meta.courseName, MARGIN.side, MARGIN.top - 6);
    doc.text(meta.documentName, page.width - MARGIN.side, MARGIN.top - 6, { align: 'right' });
    doc.text(printed, MARGIN.side, page.height - 7);
    doc.text(`Page ${n} of ${pages}`, page.width - MARGIN.side, page.height - 7, { align: 'right' });
  }
}

export function fileNameFor(meta: SheetMeta): string {
  return `${[meta.courseName, meta.documentName, meta.academicYear]
    .filter(Boolean)
    .join('_')
    .replace(/[^\w.-]+/g, '_')}.pdf`;
}

export function saveSheet(doc: jsPDF, meta: SheetMeta) {
  doc.save(fileNameFor(meta));
}
