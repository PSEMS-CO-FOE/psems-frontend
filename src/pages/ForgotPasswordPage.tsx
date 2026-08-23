import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { usePasswordResetRequest } from '@/features/auth/usePasswordResetRequest';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Notice } from '@/components/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthField } from '@/components/layout/AuthField';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  note: z.string().max(500, 'Keep this under 500 characters').optional(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const request = usePasswordResetRequest();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  if (request.isSuccess) {
    return (
      <AuthLayout
        eyebrow="Password help"
        title="Request sent"
        description="An administrator will reset the account and pass the new password back to you."
      >
        <div className="space-y-5">
          <Notice tone="positive">{request.data.message}</Notice>
          <p className="text-xs leading-relaxed text-ink-muted">
            Nobody is emailed automatically yet, so follow up through the department if you hear
            nothing. The administrator sets a temporary password and you choose your own the next
            time you sign in.
          </p>
          <Link
            to="/login"
            className="block text-center text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Password help"
      title="Ask for a reset"
      description="There is no self-service reset. This sends your request to the system's Super Admin."
    >
      <form
        onSubmit={handleSubmit((values) => request.mutate(values))}
        noValidate
        className="space-y-5"
      >
        {request.isError && (
          <Notice tone="critical">
            {getApiErrorMessage(request.error, 'Could not send the request')}
          </Notice>
        )}

        <AuthField
          label="University email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="name@sjp.ac.lk"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Anything that helps identify you (optional)"
          placeholder="e.g. CO3554 coordinator, locked out since Monday"
          error={errors.note?.message}
          {...register('note')}
        />

        <Button type="submit" className="w-full" disabled={request.isPending}>
          {request.isPending ? 'Sending…' : 'Send request'}
        </Button>

        <Link
          to="/login"
          className="block text-center text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
