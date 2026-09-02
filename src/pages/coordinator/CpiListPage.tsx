import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCourses, useCreateCpi } from '@/features/courses/useCourses';
import { useDepartmentBatches } from '@/features/courses/useCourseAccess';
import { PROJECT_TYPE_SUGGESTIONS } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, Notice, PageHeader, SkeletonText } from '@/components/ui';

const createCpiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectType: z.string().min(1, 'Project type is required'),
  participationMode: z.enum(['GROUP', 'INDIVIDUAL']),
  department: z.string().min(1, 'Department is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  batch: z.string().min(1, 'Batch is required'),
});

type CreateCpiForm = z.infer<typeof createCpiSchema>;

// Matches what the server stores: whitespace out, upper case in. Kept here as
// well so the field shows the code that will be saved, not the one typed.
const normalizeBatch = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();

// The shape nearly every intake uses. Only ever a warning — a special or repeat
// intake is exactly what a required pattern would wrongly refuse.
const LOOKS_LIKE_A_BATCH = /^\d{2}ENG$/;

export function CpiListPage() {
  const { data: courses, isLoading, isError, error } = useCourses();
  const { data: batches } = useDepartmentBatches();
  const createCpi = useCreateCpi();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCpiForm>({
    resolver: zodResolver(createCpiSchema),
    defaultValues: {
      projectType: 'Final Year Project',
      participationMode: 'GROUP',
      academicYear: '2026/2027',
      batch: '',
    },
  });

  const batchValue = watch('batch');

  const onSubmit = (values: CreateCpiForm) =>
    createCpi.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        eyebrow="Course coordinator"
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

          {/* The batch decides which students see this course, so it is
              suggested from the ones already in use rather than left free —
              the same code typed two ways would split one batch into two. */}
          <label className="block text-sm text-ink">
            Batch
            <input
              {...register('batch', {
                // The server normalises too; doing it here as well means the
                // field shows the code that will actually be stored.
                onBlur: (e) => setValue('batch', normalizeBatch(e.target.value)),
              })}
              list="known-batches"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm uppercase"
              placeholder="22ENG"
            />
            <datalist id="known-batches">
              {batches?.map((batch) => (
                <option key={batch} value={batch} />
              ))}
            </datalist>
            <span className="mt-1 block text-xs text-ink-muted">
              Two digits then ENG, as on an index number — 22ENG for the 2022 intake, 16ENG for
              2016. Case does not matter; 22eng is stored as 22ENG. Only students in this batch
              will see the course.
            </span>
            {/* A warning, not a block: a special or repeat intake is exactly the
                case a fixed pattern would refuse. */}
            {batchValue && !LOOKS_LIKE_A_BATCH.test(normalizeBatch(batchValue)) && (
              <p className="mt-1 text-xs text-caution-700">
                Most batches read like 22ENG. Check this is the code you meant.
              </p>
            )}
            {errors.batch && <p className="mt-1 text-xs text-critical-700">{errors.batch.message}</p>}
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
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
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
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {courses.map((cpi) => (
              <li key={cpi.id}>
                <Link
                  to={`/coordinator/${cpi.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-brand-50"
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
