import { useState } from 'react';
import {
  useCourseRoster,
  useDecideJoinRequest,
  useJoinRequests,
  type RosterRow,
} from '@/features/courses/useCourseAccess';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, SkeletonText, StatRow, StatTile } from '@/components/ui';

const WORKING_LABEL: Record<RosterRow['working'], string> = {
  IN_GROUP: 'In a group',
  ALONE: 'Working alone',
  NOT_STARTED: 'Not started',
};

// A student who never forms a group is invisible to allocation, sessions and
// marks. The roster is the only place that shows they exist.
function RosterTable({ rows, targetGroupSize }: { rows: RosterRow[]; targetGroupSize: number | null }) {
  return (
    <div className="table-scroll">
      <table className="data-table min-w-[36rem]">
        <thead>
          <tr>
            <th scope="col">Index</th>
            <th scope="col">Name</th>
            <th scope="col">Doing</th>
            <th scope="col">Group</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.studentId}>
              <td className="font-mono text-xs text-ink">{row.indexNumber}</td>
              <td className="text-ink">{row.name}</td>
              <td>
                <Badge tone={row.working === 'NOT_STARTED' ? 'caution' : 'neutral'}>
                  {WORKING_LABEL[row.working]}
                </Badge>
              </td>
              <td className="text-ink-muted">
                {row.group ? (
                  <>
                    {row.group.name}{' '}
                    <span className="text-ink-subtle">({row.group.size})</span>
                    {/* Advisory: the batch rarely divides evenly. */}
                    {row.offTarget && targetGroupSize !== null && (
                      <span className="ml-1 text-xs font-medium text-caution-700">not {targetGroupSize}</span>
                    )}
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Repeated students asking to take this course with a later batch. Approving is
// the access — there is nothing else to hand out afterwards.
function JoinRequests({ cpiId }: { cpiId: string }) {
  const { data: requests } = useJoinRequests(cpiId);
  const decide = useDecideJoinRequest(cpiId);
  const [note, setNote] = useState<Record<string, string>>({});

  const pending = requests?.filter((r) => r.status === 'PENDING') ?? [];
  const decided = requests?.filter((r) => r.status !== 'PENDING') ?? [];

  if (!requests || requests.length === 0) return null;

  return (
    <Card
      title="Requests to join"
      description="Students from another batch asking to take this course, usually after repeating."
    >
      {pending.length === 0 && <p className="text-xs text-ink-muted">Nothing waiting.</p>}

      <ul className="space-y-3">
        {pending.map((request) => (
          <li key={request.id} className="rounded-control border border-line p-3">
            <p className="text-sm text-ink">
              {request.student.user.fullName || request.student.user.email}{' '}
              <span className="font-mono text-xs text-ink-muted">{request.student.studentId}</span>{' '}
              <Badge tone="neutral">{request.student.batch}</Badge>
            </p>
            <p className="mt-1 text-xs text-ink-muted">{request.reason}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={note[request.id] ?? ''}
                onChange={(e) => setNote({ ...note, [request.id]: e.target.value })}
                placeholder="note to the student (optional)"
                className="flex-1 rounded-control border border-line-strong px-2 py-1 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => decide.mutate({ requestId: request.id, approve: true, note: note[request.id] })}
                disabled={decide.isPending}
              >
                Add to course
              </Button>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => decide.mutate({ requestId: request.id, approve: false, note: note[request.id] })}
                disabled={decide.isPending}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {decided.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-2">
          {decided.map((request) => (
            <li key={request.id} className="text-xs text-ink-muted">
              {request.student.studentId} · {request.student.batch} —{' '}
              {request.status === 'APPROVED' ? 'added' : 'declined'}
            </li>
          ))}
        </ul>
      )}

      {decide.isError && <Notice tone="critical">{getApiErrorMessage(decide.error)}</Notice>}
    </Card>
  );
}

export function CpiRoster({ cpiId }: { cpiId: string }) {
  const { data: roster, isLoading, isError, error } = useCourseRoster(cpiId);

  if (isLoading) return <SkeletonText />;
  if (isError) return <Notice tone="critical">{getApiErrorMessage(error)}</Notice>;
  if (!roster) return null;

  return (
    <div className="space-y-4">
      <Card
        title="Who this course is for"
        description={`Everyone in ${roster.batch}, and what each of them is doing.`}
      >
        <StatRow>
          <StatTile label="Students" value={roster.total} caption={`In ${roster.batch}`} />
          <StatTile label="In groups" value={roster.inGroups} />
          <StatTile label="Working alone" value={roster.alone} />
          <StatTile
            label="Not started"
            value={roster.notStarted}
            caption={roster.notStarted === 0 ? 'Everyone has begun' : 'No group yet'}
          />
        </StatRow>

        {/* A roster of zero almost always means the batch was mistyped — the
            students would otherwise just see nothing and assume the course is
            not ready. */}
        {roster.total === 0 ? (
          <Notice tone="caution">
            No students are in {roster.batch} in this department. Check the batch on this course
            matches the one the students were uploaded with.
          </Notice>
        ) : (
          <div className="mt-4">
            <RosterTable rows={roster.rows} targetGroupSize={roster.targetGroupSize} />
          </div>
        )}
      </Card>

      <JoinRequests cpiId={cpiId} />
    </div>
  );
}
