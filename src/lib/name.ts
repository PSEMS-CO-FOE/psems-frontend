// Full name if present (backend may return an empty string, not null), else email.
export function personName(user: { fullName: string | null; email: string }): string {
  return user.fullName && user.fullName.trim() ? user.fullName : user.email;
}
