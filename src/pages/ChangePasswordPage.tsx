import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordPolicySchema } from '@/features/auth/passwordPolicy';
import { useChangePassword } from '@/features/auth/useChangePassword';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Notice } from '@/components/ui';
import { SiteFooter } from '@/components/layout/SiteFooter';
import crest from '@/assets/crest.png';

// Two shapes: the forced first-login change omits currentPassword (the backend
// skips that check when forcePasswordChange is set); a later voluntary change
// still requires it.
const forcedSchema = z
  .object({
    newPassword: passwordPolicySchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

const voluntarySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordPolicySchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ChangePasswordForm = {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
};

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 10 characters', test: (v) => v.length >= 10 },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'A digit', test: (v) => /[0-9]/.test(v) },
  { label: 'A special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const forced = useAuthStore((s) => s.forcePasswordChange);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(forced ? forcedSchema : voluntarySchema),
  });

  const newPasswordValue = watch('newPassword') ?? '';

  const onSubmit = (values: ChangePasswordForm) =>
    changePassword.mutate({
      currentPassword: forced ? undefined : values.currentPassword,
      newPassword: values.newPassword,
    });

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 pb-[calc(var(--footer-h)+2.5rem)] pt-10">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md overflow-hidden rounded-card border border-line bg-surface shadow-raised"
        noValidate
      >
        <div className="relative overflow-hidden bg-brand-gradient px-8 py-7 text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-white/10"
          />
          <div className="relative flex items-center gap-3">
            <img
              src={crest}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg bg-white/95 object-contain p-1 shadow-card"
            />
            <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-white/70">
              Account security
            </p>
          </div>
          <h1 className="relative mt-4 text-title font-semibold text-white">Change your password</h1>
          <p className="relative mt-2 text-sm leading-relaxed text-white/80">
            {forced
              ? 'Set a new password to finish signing in.'
              : 'Enter your current password and choose a new one.'}
          </p>
        </div>

      <div className="p-8">

        {changePassword.isError && (
          <Notice tone="critical" className="mb-4">
            {getApiErrorMessage(changePassword.error, 'Could not change password')}
          </Notice>
        )}

        {/* Current password: only for a later voluntary change, not the forced
            first-login reset (the login just proved the current password). */}
        {!forced && (
          <>
            <label className="mt-5 block text-sm font-medium text-ink">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
                className="mt-1.5 h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink shadow-card transition-colors duration-fast ease-standard hover:border-ink-subtle focus:border-brand-500 focus:outline-none"
              />
            </label>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-critical-700">{errors.currentPassword.message}</p>
            )}
          </>
        )}

        <label className="mt-5 block text-sm font-medium text-ink">
          New password
          <input
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className="mt-1.5 h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink shadow-card transition-colors duration-fast ease-standard hover:border-ink-subtle focus:border-brand-500 focus:outline-none"
          />
        </label>

        <ul className="mt-3 grid gap-1.5 rounded-control bg-canvas-sunken p-3 sm:grid-cols-2">
          {RULES.map((rule) => {
            const ok = rule.test(newPasswordValue);
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-xs ${ok ? 'font-medium text-positive-700' : 'text-ink-subtle'}`}
              >
                <span aria-hidden="true">{ok ? '✓' : '○'}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>

        <label className="mt-5 block text-sm font-medium text-ink">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmNewPassword')}
            className="mt-1.5 h-10 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink shadow-card transition-colors duration-fast ease-standard hover:border-ink-subtle focus:border-brand-500 focus:outline-none"
          />
        </label>
        {errors.confirmNewPassword && (
          <p className="mt-1 text-xs text-critical-700">{errors.confirmNewPassword.message}</p>
        )}

        <Button variant="primary" fullWidth className="mt-6"
          type="submit"
          disabled={changePassword.isPending}>
          {changePassword.isPending ? 'Saving…' : 'Change password'}
        </Button>
      </div>
      </form>

      <SiteFooter />
    </div>
  );
}
