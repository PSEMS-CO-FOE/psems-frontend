import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSystemAdmin, useSystemAdmins } from '@/features/superAdmin/useSuperAdmin';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, EmptyState, Field, Notice, PageHeader, SkeletonCard } from '@/components/ui';
import { OneTimePassword } from './OneTimePassword';

const newAdminSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  fullName: z.string().min(1, 'A name is required'),
});

type NewAdminForm = z.infer<typeof newAdminSchema>;

export function SuperAdminAdminsPage() {
  const { data: admins, isLoading, isError, error } = useSystemAdmins();
  const create = useCreateSystemAdmin();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewAdminForm>({ resolver: zodResolver(newAdminSchema) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        eyebrow="Account management"
        description="System Admins approve lecturers, upload students and appoint coordinators. A Super Admin does none of that — the two roles are deliberately separate."
      />

      {create.isSuccess && (
        <OneTimePassword email={create.data.user.email} password={create.data.tempPassword} />
      )}

      <Card
        title="Add a System Admin"
        description="They receive a temporary password and must choose their own at first sign-in."
      >
        <form
          onSubmit={handleSubmit((values) =>
            create.mutate(values, { onSuccess: () => reset() }),
          )}
          noValidate
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field
            label="University email"
            type="email"
            placeholder="name@sjp.ac.lk"
            error={errors.email?.message}
            {...register('email')}
          />
          <Field
            label="Full name"
            placeholder="A. Perera"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>

        {create.isError && (
          <Notice tone="critical" className="mt-4">
            {getApiErrorMessage(create.error, 'Could not create the administrator')}
          </Notice>
        )}
      </Card>

      {isLoading && <SkeletonCard rows={3} />}
      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load administrators')}</Notice>
      )}

      {admins && admins.length === 0 && (
        <EmptyState
          title="No System Admins yet"
          hint="Nobody can approve a lecturer or upload students until one exists. Add the first above."
        />
      )}

      {admins && admins.length > 0 && (
        <Card title="System Admins" description={`${admins.length} in total.`}>
          <ul className="divide-y divide-line">
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {admin.fullName || admin.email}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{admin.email}</p>
                </div>
                {admin.suspendedAt && <Badge tone="critical">Suspended</Badge>}
                {admin.forcePasswordChange && <Badge tone="caution">Password not set</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
