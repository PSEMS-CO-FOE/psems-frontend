import { useParams } from 'react-router-dom';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { Badge, Card, EmptyState } from '@/components/ui';
import { CpiTimelinePanel } from './CpiTimelinePanel';
import { CourseSettingsPanel } from './CourseSettingsPanel';
import { CpiAssignments } from './CpiAssignments';

const INVITE_TONE = {
  ACCEPTED: 'positive',
  PENDING: 'caution',
  DECLINED: 'neutral',
} as const;

export function CpiSetupPage() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiDetail(cpiId);

  return (
    <div className="space-y-6">
      <CourseSettingsPanel cpiId={cpiId} />

      <CpiTimelinePanel cpiId={cpiId} />

      <CpiAssignments cpiId={cpiId} mode={cpi?.mode ?? null} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Supervisors">
          {cpi && cpi.supervisors.length === 0 ? (
            <EmptyState
              title="No supervisors invited"
              hint="Invite lecturers above, or approve a request from a lecturer who asked to join."
            />
          ) : (
            <ul className="space-y-1.5">
              {cpi?.supervisors.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm text-ink">
                  {s.lecturer.user.fullName ?? s.lecturer.user.email}
                  <Badge tone={INVITE_TONE[s.invitationStatus]}>{s.invitationStatus.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Evaluators">
          {cpi && cpi.evaluators.length === 0 ? (
            <EmptyState
              title="No evaluators assigned"
              hint="A course can run without them — panels are built per stage under Evaluation."
            />
          ) : (
            <ul className="space-y-1.5">
              {cpi?.evaluators.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm text-ink">
                  {e.lecturer.user.fullName ?? e.lecturer.user.email}
                  {e.isHeadJudge && <Badge tone="info">Head Judge</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
