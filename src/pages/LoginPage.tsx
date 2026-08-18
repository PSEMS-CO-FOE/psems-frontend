import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLogin } from '@/features/auth/useLogin';
import { getApiErrorMessage } from '@/lib/apiError';
import { Notice } from '@/components/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthField } from '@/components/layout/AuthField';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  return (
    <AuthLayout
      eyebrow="Secure sign in"
      title="Welcome back"
      description="Use your university credentials to access the portal."
    >
      <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate className="space-y-5">
        {login.isError && (
          <Notice tone="critical">{getApiErrorMessage(login.error, 'Login failed')}</Notice>
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
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Not the shared Button: this one is taller than anything in the app and
            carries an arrow that moves on hover. */}
        <button
          type="submit"
          disabled={login.isPending}
          className="group flex w-full items-center justify-center gap-2 rounded-control bg-brand-600 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition duration-fast ease-standard hover:bg-brand-700 hover:shadow-raised active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
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

        <div className="flex items-center gap-3 pt-1">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* There is no SSO and no self-service reset, so this is where the two
            paths that do exist are stated plainly instead. */}
        <div className="rounded-control border border-line bg-surface px-4 py-3.5 text-center text-xs leading-relaxed text-ink-muted shadow-card">
          Lecturers can{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            register for an account
          </Link>
          . Students are issued credentials by the department.
        </div>

        <p className="text-center text-xs text-ink-subtle">
          Forgotten your password? Ask your course coordinator or the system administrator to
          reissue it.
        </p>
      </form>
    </AuthLayout>
  );
}
