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
