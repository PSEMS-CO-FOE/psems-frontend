import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { passwordPolicySchema } from '@/features/auth/passwordPolicy';
import { useRegisterLecturer } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';

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

  const onSubmit = (values: RegisterForm) => registerLecturer.mutate(values);

  if (registerLecturer.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow text-center">
          <h1 className="text-xl font-bold text-gray-800">Registration received</h1>
          <p className="mt-2 text-sm text-gray-500">
            {registerLecturer.data.message}
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow"
        noValidate
      >
        <h1 className="text-xl font-bold text-gray-800">Register as a lecturer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account is reviewed by a System Admin before you can sign in.
        </p>

        {registerLecturer.isError && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(registerLecturer.error, 'Registration failed')}
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Full name
          <input
            type="text"
            autoComplete="name"
            {...register('fullName')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            autoComplete="username"
            {...register('email')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}

        <button
          type="submit"
          disabled={registerLecturer.isPending}
          className="mt-6 w-full rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {registerLecturer.isPending ? 'Submitting…' : 'Register'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-700 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
