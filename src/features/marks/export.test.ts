import { describe, expect, it } from 'vitest';
import { markSheetFilename, markSheetToCsv, toCsv } from './export';
import type { MarkSheet } from './useMarks';

const sheet: MarkSheet = {
  courseName: 'Computer Engineering FYP',
  academicYear: '2026',
  gradingEnabled: false,
  passMarkPercent: null,
  caContributionPercent: 40,
  stages: [
    { id: 'st1', name: 'Proposal', weight: 40 },
    { id: 'st2', name: 'Final Demo', weight: 60 },
  ],
  weights: { st1: 0.4, st2: 0.6 },
  rows: [
    {
      indexNumber: 'EN001',
      registrationNumber: '2020/E/001',
      surname: 'Perera',
      initials: 'A.B.',
      name: 'Anura Bandara Perera',
      groupName: 'Group A',
      stagePercents: { st1: 80, st2: 90 },
      total: 86,
      grade: null,
      zeroTotal: false,
      belowPassMark: false,
    },
    {
      indexNumber: 'EN002',
      registrationNumber: null,
      surname: 'Silva',
      initials: 'C.',
      name: 'Chamari Silva',
      groupName: 'Group A',
      stagePercents: { st1: 80, st2: null },
      total: 0,
      grade: null,
      zeroTotal: true,
      belowPassMark: true,
    },
  ],
  flagged: 1,
  belowPassMark: 1,
};

function lines(csv: string) {
  return csv.split('\r\n');
}

describe('toCsv', () => {
  it('leaves plain values alone', () => {
    expect(toCsv([['a', 1, 'b']])).toBe('a,1,b');
  });

  it('quotes fields holding a comma, a quote or a newline', () => {
    expect(toCsv([['Perera, A.']])).toBe('"Perera, A."');
    expect(toCsv([['say "hi"']])).toBe('"say ""hi"""');
    expect(toCsv([['two\nlines']])).toBe('"two\nlines"');
  });

  it('writes an empty field for null', () => {
    expect(toCsv([[null, 'x']])).toBe(',x');
  });
});

describe('markSheetToCsv', () => {
  it('puts one column per stage between the details and the total', () => {
    const [header] = lines(markSheetToCsv(sheet));
    expect(header).toBe('Index Number,Reg. Number,Surname,Initials,Group,Proposal,Final Demo,Total');
  });

  it('writes the weight row above the marks, summing to 1', () => {
    const [, weights] = lines(markSheetToCsv(sheet));
    expect(weights).toBe('Weight,,,,,0.4,0.6,1');
  });

  it('writes one row per student', () => {
    const rows = lines(markSheetToCsv(sheet));
    expect(rows).toHaveLength(4);
    expect(rows[2]).toBe('EN001,2020/E/001,Perera,A.B.,Group A,80,90,86');
  });

  it('leaves a missing registration number and an unscored stage blank', () => {
    const rows = lines(markSheetToCsv(sheet));
    expect(rows[3]).toBe('EN002,,Silva,C.,Group A,80,,0');
  });

  it('adds a grade column only when the course awards grades', () => {
    const graded: MarkSheet = {
      ...sheet,
      gradingEnabled: true,
      rows: [{ ...sheet.rows[0], grade: 'A' }],
    };
    const rows = lines(markSheetToCsv(graded));
    expect(rows[0].endsWith('Total,Grade')).toBe(true);
    expect(rows[2].endsWith(',86,A')).toBe(true);
  });
});

describe('markSheetFilename', () => {
  it('builds a safe filename from the course and year', () => {
    expect(markSheetFilename(sheet)).toBe('Computer_Engineering_FYP_2026_CA.csv');
  });

  it('falls back when the course name has nothing usable', () => {
    expect(markSheetFilename({ ...sheet, courseName: '///', academicYear: '' })).toBe('marks_CA.csv');
  });
});
