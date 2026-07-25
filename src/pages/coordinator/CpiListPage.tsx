import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCourses, useCreateCpi } from '@/features/courses/useCourses';
import { PROJECT_TYPE_SUGGESTIONS } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';

const createCpiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectType: z.string().min(1, 'Project type is required'),
  participationMode: z.enum(['GROUP', 'INDIVIDUAL']),
  department: z.string().min(1, 'Department is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
});

type CreateCpiForm = z.infer<typeof createCpiSchema>;

export function CpiListPage() {
  const { data: courses, isLoading, isError, error } = useCourses();
  const createCpi = useCreateCpi();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCpiForm>({
    resolver: zodResolver(createCpiSchema),
    defaultValues: {
      projectType: 'Final Year Project',
      participationMode: 'GROUP',
      academicYear: '2026/2027',
    },
  });

  const onSubmit = (values: CreateCpiForm) =>
    createCpi.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      {/* Create CPI */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Create a course instance (CPI)</h2>

        {createCpi.isError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(createCpi.error, 'Could not create CPI')}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid grid-cols-2 gap-3" noValidate>
          <label className="col-span-2 block text-sm text-gray-700">
            Name
            <input
              {...register('name')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. CO3554 Final Year Project 2026"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </label>

          <label className="block text-sm text-gray-700">
            Project type
            <input
              {...register('projectType')}
              list="project-type-suggestions"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Final Year Project"
            />
            <datalist id="project-type-suggestions">
              {PROJECT_TYPE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {errors.projectType && (
              <p className="mt-1 text-xs text-red-600">{errors.projectType.message}</p>
            )}
          </label>

          <label className="block text-sm text-gray-700">
            Participation
            <select
              {...register('participationMode')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="GROUP">Group</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </label>

          <label className="block text-sm text-gray-700">
            Department
            <input
              {...register('department')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Computer Engineering"
            />
            {errors.department && (
              <p className="mt-1 text-xs text-red-600">{errors.department.message}</p>
            )}
          </label>

          <label className="block text-sm text-gray-700">
            Academic year
            <input
              {...register('academicYear')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.academicYear && (
              <p className="mt-1 text-xs text-red-600">{errors.academicYear.message}</p>
            )}
          </label>

          <div className="col-span-2">
            <button
              type="submit"
              disabled={createCpi.isPending}
              className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {createCpi.isPending ? 'Creating…' : 'Create CPI'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing CPIs */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">My CPIs</h2>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(error, 'Could not load CPIs')}
          </p>
        )}
        {courses && courses.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No CPIs yet — create one above.
          </p>
        )}
        {courses && courses.length > 0 && (
          <ul className="divide-y rounded-lg border bg-white">
            {courses.map((cpi) => (
              <li key={cpi.id}>
                <Link
                  to={`/coordinator/${cpi.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cpi.name}</p>
                    <p className="text-xs text-gray-500">
                      {cpi.projectType} · {cpi.participationMode} · {cpi.department} ·{' '}
                      {cpi.academicYear}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {cpi.mode ?? 'mode not set'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
