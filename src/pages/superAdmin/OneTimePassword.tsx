import { Notice } from '@/components/ui';

/**
 * A temporary password is returned once and is never readable again — only its
 * hash is stored. Showing it in a dismissible toast would lose it, so it stays
 * on the page until the reader navigates away deliberately.
 */
export function OneTimePassword({ email, password }: { email: string; password: string }) {
  return (
    <Notice tone="positive">
      <span className="block font-semibold">Copy this now — it cannot be shown again.</span>
      <span className="mt-1 block text-xs">
        {email} ·{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-ink">
          {password}
        </code>
      </span>
      <span className="mt-1 block text-xs">
        They must choose their own password the first time they sign in.
      </span>
    </Notice>
  );
}
