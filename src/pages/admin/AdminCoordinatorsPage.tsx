import { useApprovedLecturers, useAssignCoordinator } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Button, Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';

// System Admin promotes an approved lecturer to Course Coordinator.
export function AdminCoordinatorsPage() {
  const { data: lecturers, isLoading, isError, error } = useApprovedLecturers();
  const assign = useAssignCoordinator();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coordinators"
        description="Promote an approved lecturer so they can create and run courses."
      />

      {isLoading && <SkeletonCard rows={3} />}

      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load lecturers')}</Notice>
      )}

      {lecturers && lecturers.length === 0 && (
        <EmptyState
          title="No approved lecturers yet"
          hint="Approve a lecturer on the Lecturer approvals page before assigning one as coordinator."
        />
      )}

      {assign.isError && <Notice tone="critical">{getApiErrorMessage(assign.error)}</Notice>}
      {assign.isSuccess && (
        <Notice tone="positive">Lecturer promoted to Course Coordinator.</Notice>
      )}

      {lecturers && lecturers.length > 0 && (
        <Card
          title="Approved lecturers"
          description="Anyone here can be given the Course Coordinator role."
        >
          <ul className="divide-y divide-line">
            {lecturers.map((l) => (
              <li key={l.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0 text-sm">
                  <span className="block truncate font-medium text-ink">{personName(l)}</span>
                  <span className="block truncate text-xs text-ink-subtle">{l.email}</span>
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => assign.mutate(l.userId)}
                  disabled={assign.isPending}
                >
                  Make coordinator
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
