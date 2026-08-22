import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordPolicySchema } from '@/features/auth/passwordPolicy';
import { useChangePassword } from '@/features/auth/useChangePassword';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Notice } from '@/components/ui';

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
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-card bg-surface p-8 shadow"
        noValidate
      >
        <h1 className="text-xl font-bold text-ink">Change your password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {forced
            ? 'Set a new password to finish signing in.'
            : 'Enter your current password and choose a new one.'}
        </p>

        {changePassword.isError && (
          <Notice tone="critical" className="mt-4">
            {getApiErrorMessage(changePassword.error, 'Could not change password')}
          </Notice>
        )}

        {/* Current password: only for a later voluntary change, not the forced
            first-login reset (the login just proved the current password). */}
        {!forced && (
          <>
            <label className="mt-4 block text-sm font-medium text-ink">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
                className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-critical-700">{errors.currentPassword.message}</p>
            )}
          </>
        )}

        <label className="mt-4 block text-sm font-medium text-ink">
          New password
          <input
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <ul className="mt-2 space-y-1">
          {RULES.map((rule) => {
            const ok = rule.test(newPasswordValue);
            return (
              <li
                key={rule.label}
                className={`text-xs ${ok ? 'text-positive-700' : 'text-ink-subtle'}`}
              >
                {ok ? '✓' : '○'} {rule.label}
              </li>
            );
          })}
        </ul>

        <label className="mt-4 block text-sm font-medium text-ink">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmNewPassword')}
            className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
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
      </form>
    </div>
  );
}
