import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCourses, useCreateCpi } from '@/features/courses/useCourses';
import { PROJECT_TYPE_SUGGESTIONS } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, Notice, PageHeader, SkeletonText } from '@/components/ui';

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
      <PageHeader
        title="My courses"
        description="Every course instance you coordinate. Open one to set its timeline, people and evaluation."
      />

      <Card title="Create a course">

        {createCpi.isError && (
          <Notice tone="critical" className="mt-3">
            {getApiErrorMessage(createCpi.error, 'Could not create CPI')}
          </Notice>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid grid-cols-2 gap-3" noValidate>
          <label className="col-span-2 block text-sm text-ink">
            Name
            <input
              {...register('name')}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
              placeholder="e.g. CO3554 Final Year Project 2026"
            />
            {errors.name && <p className="mt-1 text-xs text-critical-700">{errors.name.message}</p>}
          </label>

          <label className="block text-sm text-ink">
            Project type
            <input
              {...register('projectType')}
              list="project-type-suggestions"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
              placeholder="e.g. Final Year Project"
            />
            <datalist id="project-type-suggestions">
              {PROJECT_TYPE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {errors.projectType && (
              <p className="mt-1 text-xs text-critical-700">{errors.projectType.message}</p>
            )}
          </label>

          <label className="block text-sm text-ink">
            Participation
            <select
              {...register('participationMode')}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            >
              <option value="GROUP">Group</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </label>

          <label className="block text-sm text-ink">
            Department
            <input
              {...register('department')}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
              placeholder="Computer Engineering"
            />
            {errors.department && (
              <p className="mt-1 text-xs text-critical-700">{errors.department.message}</p>
            )}
          </label>

          <label className="block text-sm text-ink">
            Academic year
            <input
              {...register('academicYear')}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            />
            {errors.academicYear && (
              <p className="mt-1 text-xs text-critical-700">{errors.academicYear.message}</p>
            )}
          </label>

          <div className="col-span-2">
            <Button variant="primary"
              type="submit"
              disabled={createCpi.isPending}>
              {createCpi.isPending ? 'Creating…' : 'Create CPI'}
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Your courses
        </h2>
        {isLoading && <SkeletonText />}
        {isError && (
          <Notice tone="critical">
            {getApiErrorMessage(error, 'Could not load CPIs')}
          </Notice>
        )}
        {courses && courses.length === 0 && (
          <EmptyState
            title="No courses yet"
            hint="Create one above to set its timeline, add supervisors and open it to students."
          />
        )}
        {courses && courses.length > 0 && (
          <ul className="divide-y rounded-card border border-line bg-surface">
            {courses.map((cpi) => (
              <li key={cpi.id}>
                <Link
                  to={`/coordinator/${cpi.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-canvas"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{cpi.name}</p>
                    <p className="text-xs text-ink-muted">
                      {cpi.projectType} · {cpi.participationMode} · {cpi.department} ·{' '}
                      {cpi.academicYear}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-ink-subtle">
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
