import { useSetCourseStatus } from '@/features/courses/useCourseAccess';
import type { CourseStatus } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice } from '@/components/ui';

// Draft, active, archived. A course starts as a draft so it can be set up
// without students watching, and is archived when it is over — which keeps it
// readable to the students who took it and hides it from everyone else.
const STATE_COPY: Record<CourseStatus, { badge: string; tone: 'neutral' | 'positive' | 'caution'; says: string }> = {
  DRAFT: {
    badge: 'Draft',
    tone: 'caution',
    says: 'Only you can see this course. Publish it when the batch should be able to find and join it.',
  },
  ACTIVE: {
    badge: 'Open',
    tone: 'positive',
    says: 'Students in this batch can find and join this course.',
  },
  ARCHIVED: {
    badge: 'Archived',
    tone: 'neutral',
    says: 'Finished. Only the students who took it can still see it.',
  },
};

export function CourseStatePanel({
  cpiId,
  status,
  batch,
}: {
  cpiId: string;
  status: CourseStatus;
  batch: string;
}) {
  const setStatus = useSetCourseStatus(cpiId);
  const copy = STATE_COPY[status];

  return (
    <Card
      title="Course state"
      description={copy.says}
      actions={
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{batch}</Badge>
          <Badge tone={copy.tone}>{copy.badge}</Badge>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {status !== 'ACTIVE' && (
          <Button variant="primary" size="sm" onClick={() => setStatus.mutate('ACTIVE')} disabled={setStatus.isPending}>
            {status === 'DRAFT' ? 'Publish to ' + batch : 'Reopen'}
          </Button>
        )}
        {status === 'ACTIVE' && (
          <>
            <Button variant="neutral" size="sm" onClick={() => setStatus.mutate('ARCHIVED')} disabled={setStatus.isPending}>
              Archive
            </Button>
            <Button variant="neutral" size="sm" onClick={() => setStatus.mutate('DRAFT')} disabled={setStatus.isPending}>
              Back to draft
            </Button>
          </>
        )}
      </div>

      {setStatus.isError && <Notice tone="critical">{getApiErrorMessage(setStatus.error)}</Notice>}
    </Card>
  );
}
