// Full name if present (backend may return an empty string, not null), else email.
export function personName(user: { fullName: string | null; email: string }): string {
  return user.fullName && user.fullName.trim() ? user.fullName : user.email;
}

/** Accounts carry a name or an email, never an image, so an avatar is always
 *  initials — from the name when there is one, from the address otherwise. */
export function initialsFrom(nameOrEmail: string | undefined | null): string {
  if (!nameOrEmail) return '?';
  const source = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

// Kept whole at the front of a name. "Dr. Krishanth Mohan" is Dr. K.Mohan,
// never D.K.Mohan.
const TITLES = new Set(['dr', 'prof', 'assoc', 'mr', 'mrs', 'ms', 'miss', 'eng', 'rev', 'hon']);

const isTitle = (part: string) => TITLES.has(part.replace(/\./g, '').toLowerCase());

/**
 * Shortens a long name to initials plus the last part, the way a Sri Lankan
 * name is usually written down: "Dulina Hansa Nimsara" becomes "D.H.Nimsara".
 * A name that already fits is returned untouched, so this can be applied
 * wherever space is tight without flattening every short name too.
 */
export function shortName(nameOrEmail: string | undefined | null, max = 18): string {
  if (!nameOrEmail) return '';
  const full = nameOrEmail.trim().replace(/\s+/g, ' ');

  // An address is not a name — initialising one makes it unrecognisable.
  if (!full || full.includes('@') || full.length <= max) return full;

  const parts = full.split(' ');
  const titles: string[] = [];
  while (parts.length > 0 && isTitle(parts[0])) titles.push(parts.shift() as string);

  // Nothing left to initialise: a lone surname, with or without a title.
  if (parts.length < 2) return full;

  const last = parts.pop() as string;
  const initials = parts.map((part) => `${part[0].toUpperCase()}.`).join('');
  return `${titles.length ? `${titles.join(' ')} ` : ''}${initials}${last}`;
}
