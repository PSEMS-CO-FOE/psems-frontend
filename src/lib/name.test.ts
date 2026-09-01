import { describe, expect, it } from 'vitest';
import { initialsFrom, personName, shortName } from './name';

describe('personName', () => {
  it('falls back to the email when the name is missing or blank', () => {
    expect(personName({ fullName: null, email: 'a@psems.dev' })).toBe('a@psems.dev');
    expect(personName({ fullName: '   ', email: 'a@psems.dev' })).toBe('a@psems.dev');
    expect(personName({ fullName: 'Ada Perera', email: 'a@psems.dev' })).toBe('Ada Perera');
  });
});

describe('initialsFrom', () => {
  it('takes the first letter of two name parts', () => {
    expect(initialsFrom('Ada Perera')).toBe('AP');
  });

  it('reads an address when there is no name', () => {
    expect(initialsFrom('ada.perera@psems.dev')).toBe('AP');
  });

  it('has something to show for an empty value', () => {
    expect(initialsFrom(null)).toBe('?');
  });
});

describe('shortName', () => {
  it('writes a long name as initials plus the last part', () => {
    expect(shortName('Dulina Hansa Nimsara')).toBe('D.H.Nimsara');
  });

  it('leaves a name that already fits alone', () => {
    expect(shortName('Ada Perera')).toBe('Ada Perera');
  });

  it('keeps a title whole rather than initialising it', () => {
    expect(shortName('Dr. Krishanth Mohan')).toBe('Dr. K.Mohan');
    expect(shortName('Prof. Dulina Hansa Nimsara')).toBe('Prof. D.H.Nimsara');
    expect(shortName('Assoc. Prof. Krishanth Mohan')).toBe('Assoc. Prof. K.Mohan');
  });

  it('leaves a title plus a lone surname alone, having nothing to initialise', () => {
    expect(shortName('Dr. Wickramasinghearachchige')).toBe('Dr. Wickramasinghearachchige');
  });

  it('shortens a long two-part name too', () => {
    expect(shortName('Wickramasinghe Rajapaksha')).toBe('W.Rajapaksha');
  });

  // Initialising an address would leave nothing anyone could recognise.
  it('never touches an email', () => {
    expect(shortName('a.very.long.address@psems.dev')).toBe('a.very.long.address@psems.dev');
  });

  it('leaves a single long word alone, having nothing to initialise', () => {
    expect(shortName('Wickramasinghearachchige')).toBe('Wickramasinghearachchige');
  });

  it('copes with stray whitespace and empty values', () => {
    expect(shortName('  Dulina   Hansa   Nimsara  ')).toBe('D.H.Nimsara');
    expect(shortName(null)).toBe('');
    expect(shortName('')).toBe('');
  });
});
