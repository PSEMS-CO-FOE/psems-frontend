import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useLogin } from '@/features/auth/useLogin';
import { getApiErrorMessage } from '@/lib/apiError';

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

  const onSubmit = (values: LoginForm) => login.mutate(values);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
        noValidate
      >
        <h1 className="text-xl font-bold text-gray-800">PSEMS — Sign in</h1>

        {login.isError && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(login.error, 'Login failed')}
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            autoComplete="username"
            {...register('email')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="mt-6 w-full rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Are you a lecturer?{' '}
          <Link to="/register" className="text-gray-700 underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
