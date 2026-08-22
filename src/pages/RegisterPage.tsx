import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { passwordPolicySchema } from '@/features/auth/passwordPolicy';
import { useRegisterLecturer } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';
import { Notice } from '@/components/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthField } from '@/components/layout/AuthField';

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: passwordPolicySchema,
});

type RegisterForm = z.infer<typeof registerSchema>;

// Public lecturer self-registration (spec: lecturers apply, System Admin
// approves). The account is created PENDING; login stays blocked until approval.
export function RegisterPage() {
  const registerLecturer = useRegisterLecturer();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  if (registerLecturer.isSuccess) {
    return (
      <AuthLayout
        eyebrow="Request received"
        title="Registration received"
        description="Your account has been created and is waiting on approval."
      >
        <div className="space-y-6">
          <Notice tone="positive">{registerLecturer.data.message}</Notice>
          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded-control bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition duration-fast ease-standard hover:bg-brand-700 hover:shadow-raised active:translate-y-px"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Lecturer registration"
      title="Create an account"
      description="Register with your university email. An administrator approves the account before you can sign in."
    >
      <form
        onSubmit={handleSubmit((values) => registerLecturer.mutate(values))}
        noValidate
        className="space-y-5"
      >
        {registerLecturer.isError && (
          <Notice tone="critical">
            {getApiErrorMessage(registerLecturer.error, 'Registration failed')}
          </Notice>
        )}

        <AuthField
          label="Full name"
          autoComplete="name"
          autoFocus
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <AuthField
          label="University email"
          type="email"
          autoComplete="username"
          placeholder="name@sjp.ac.lk"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <p className="text-xs leading-relaxed text-ink-subtle">
          At least 10 characters, with an upper and lower case letter, a digit and a symbol.
        </p>

        <button
          type="submit"
          disabled={registerLecturer.isPending}
          className="group flex w-full items-center justify-center gap-2 rounded-control bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition duration-fast ease-standard hover:bg-brand-700 hover:shadow-raised active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {registerLecturer.isPending ? 'Creating account…' : 'Create account'}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-base ease-standard group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        <p className="text-center text-xs text-ink-subtle">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
