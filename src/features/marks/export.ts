import type { MarkSheet } from './useMarks';

// Turn the CA sheet into the CSV the department's own summary sheet uses: a
// weight row above the data, one row per student, one column per stage, and a
// total. Kept as a pure function so it can be tested without a browser.

// A field is quoted when it holds a comma, a quote or a line break, and inner
// quotes are doubled. That is the whole of the CSV escaping rule.
function escapeField(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n');
}

export function markSheetToCsv(sheet: MarkSheet): string {
  const stageNames = sheet.stages.map((s) => s.name);
  const header = ['Index Number', 'Reg. Number', 'Surname', 'Initials', 'Group', ...stageNames, 'Total'];
  if (sheet.gradingEnabled) header.push('Grade');

  // The weight row sits above the marks, as it does on the printed sheet. The
  // leading blanks keep it under the right columns.
  const weights: (string | number | null)[] = ['Weight', '', '', '', '', ...sheet.stages.map((s) => sheet.weights[s.id] ?? 0), 1];
  if (sheet.gradingEnabled) weights.push('');

  const rows = sheet.rows.map((row) => {
    const cells: (string | number | null)[] = [
      row.indexNumber,
      row.registrationNumber,
      row.surname,
      row.initials,
      row.groupName,
      ...sheet.stages.map((s) => row.stagePercents[s.id] ?? ''),
      row.total,
    ];
    if (sheet.gradingEnabled) cells.push(row.grade ?? '');
    return cells;
  });

  return toCsv([header, weights, ...rows]);
}

export function markSheetFilename(sheet: MarkSheet): string {
  const safe = `${sheet.courseName} ${sheet.academicYear}`.replace(/[^\w\-. ]+/g, '').trim().replace(/\s+/g, '_');
  return `${safe || 'marks'}_CA.csv`;
}

// Hand the file to the browser. A blob URL rather than a data URL, because a
// full cohort's sheet can be larger than a URL is allowed to be.
export function downloadCsv(filename: string, csv: string) {
  // The BOM makes Excel read UTF-8 correctly instead of guessing.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
