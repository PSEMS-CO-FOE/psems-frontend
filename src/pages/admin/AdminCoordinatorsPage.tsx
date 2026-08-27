import {
  useApprovedLecturers,
  useAssignCoordinator,
  useRevokeCoordinator,
  type ApprovedLecturer,
} from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';

const isCoordinator = (lecturer: ApprovedLecturer) => lecturer.role === 'COURSE_COORDINATOR';

// System Admin promotes an approved lecturer to Course Coordinator.
export function AdminCoordinatorsPage() {
  const { data: lecturers, isLoading, isError, error } = useApprovedLecturers();
  const assign = useAssignCoordinator();
  const revoke = useRevokeCoordinator();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coordinators"
        eyebrow="System administration"
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
      {revoke.isError && <Notice tone="critical">{getApiErrorMessage(revoke.error)}</Notice>}
      {revoke.isSuccess && <Notice tone="positive">Coordinator role removed.</Notice>}
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
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink">{personName(l)}</span>
                    {isCoordinator(l) && <Badge tone="brand">Coordinator</Badge>}
                  </span>
                  <span className="block truncate text-xs text-ink-subtle">{l.email}</span>
                </span>
                {isCoordinator(l) ? (
                  <Button
                    variant="danger-quiet"
                    size="sm"
                    onClick={() => revoke.mutate(l.userId)}
                    disabled={revoke.isPending}
                  >
                    Remove the role
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => assign.mutate(l.userId)}
                    disabled={assign.isPending}
                  >
                    Make coordinator
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
