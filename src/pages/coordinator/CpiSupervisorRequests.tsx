import {
  useDecideSupervisorRequest,
  useSupervisorRequests,
} from '@/features/courses/useSupervisorRequests';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName, shortName } from '@/lib/name';
import { Button, Card, EmptyState, SkeletonText, Notice } from '@/components/ui';

// Lecturers who found this course themselves and asked to join. Approving sends
// them an invitation — they still have to accept it.
export function CpiSupervisorRequests({ cpiId }: { cpiId: string }) {
  const { data, isLoading } = useSupervisorRequests(cpiId);
  const decide = useDecideSupervisorRequest(cpiId);

  const pending = data?.filter((r) => r.status === 'PENDING') ?? [];
  const settled = data?.filter((r) => r.status !== 'PENDING') ?? [];

  return (
    <Card title="Requests to supervise" description="Approving creates a supervisor invitation, which the lecturer then accepts.">

      {isLoading && <SkeletonText className="mt-2" />}
      {decide.isError && <Notice tone="critical" size="xs" className="mt-2">{getApiErrorMessage(decide.error)}</Notice>}

      {pending.length === 0 && !isLoading && (
        <EmptyState density="compact" title="No pending requests" hint="Lecturers who ask to supervise a group on this course appear here." />
      )}

      <ul className="mt-2 space-y-2">
        {pending.map((r) => (
          <li key={r.id} className="rounded-control border border-line p-2">
            <p className="text-xs font-medium text-ink" title={personName(r.lecturer.user)}>
              {shortName(personName(r.lecturer.user))}
            </p>
            {r.note && <p className="mt-0.5 text-xs text-ink-muted">{r.note}</p>}
            <div className="mt-1 flex gap-2">
              <Button variant="success" size="sm"
                onClick={() => decide.mutate({ requestId: r.id, decision: 'APPROVE' })}
                disabled={decide.isPending}>
                Approve
              </Button>
              <Button
                onClick={() => decide.mutate({ requestId: r.id, decision: 'REJECT' })}
                disabled={decide.isPending}
                variant="secondary"
                size="sm"
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {settled.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {settled.map((r) => (
            <li key={r.id} className="text-xs text-ink-subtle">
              {personName(r.lecturer.user)} — {r.status.toLowerCase()}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
