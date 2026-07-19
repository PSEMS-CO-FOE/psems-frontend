import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { passwordPolicySchema } from '@/features/auth/passwordPolicy';
import { useChangePassword } from '@/features/auth/useChangePassword';
import { getApiErrorMessage } from '@/lib/apiError';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordPolicySchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 10 characters', test: (v) => v.length >= 10 },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'A digit', test: (v) => /[0-9]/.test(v) },
  { label: 'A special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePasswordPage() {
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const newPasswordValue = watch('newPassword') ?? '';

  const onSubmit = (values: ChangePasswordForm) =>
    changePassword.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
        noValidate
      >
        <h1 className="text-xl font-bold text-gray-800">Change your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          You must set a new password before continuing.
        </p>

        {changePassword.isError && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(changePassword.error, 'Could not change password')}
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          New password
          <input
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>

        <ul className="mt-2 space-y-1">
          {RULES.map((rule) => {
            const ok = rule.test(newPasswordValue);
            return (
              <li
                key={rule.label}
                className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}
              >
                {ok ? '✓' : '○'} {rule.label}
              </li>
            );
          })}
        </ul>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmNewPassword')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.confirmNewPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmNewPassword.message}</p>
        )}

        <button
          type="submit"
          disabled={changePassword.isPending}
          className="mt-6 w-full rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {changePassword.isPending ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
