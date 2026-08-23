import { Outlet, useParams } from 'react-router-dom';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { statusOfPhases } from '@/features/courses/phaseStatus';
import type { CpiPhaseName } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, ErrorText, PageHeader, SkeletonCard, TabNav, type TabItem } from '@/components/ui';

/** Each tab and the timeline phases it covers, so a tab can say whether its
 *  part of the course is open right now. Setup has no phase of its own — the
 *  timeline and the settings are editable throughout. */
const TABS: { path: string; label: string; phases: CpiPhaseName[] }[] = [
  { path: 'setup', label: 'Setup', phases: ['STUDENT_REGISTRATION', 'SUPERVISOR_ADDITION'] },
  { path: 'ideas', label: 'Ideas', phases: ['IDEA_ANNOUNCEMENT'] },
  { path: 'selection', label: 'Selection', phases: ['PROJECT_SELECTION'] },
  { path: 'allocation', label: 'Allocation', phases: ['PROJECT_REGISTRATION'] },
  { path: 'evaluation', label: 'Evaluation', phases: ['EVALUATION_CONFIG'] },
  { path: 'submissions', label: 'Submissions', phases: ['PROPOSAL_SUBMISSION', 'FINAL_SUBMISSION'] },
  { path: 'schedule', label: 'Schedule', phases: ['AVAILABILITY_SUBMISSION'] },
  { path: 'marks', label: 'Marks', phases: ['EVALUATION_EXECUTION'] },
];

export function CpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi, isLoading, isError, error } = useCpiDetail(cpiId);

  const tabs: TabItem[] = TABS.map((t) => ({
    to: `/coordinator/${cpiId}/${t.path}`,
    label: t.label,
    status: statusOfPhases(cpi?.timeline, t.phases),
  }));

  if (isLoading) return <SkeletonCard />;
  if (isError || !cpi) return <ErrorText>{getApiErrorMessage(error, 'Could not load this course')}</ErrorText>;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/coordinator', label: 'My courses' }}
        title={cpi.name}
        eyebrow={`${cpi.department} · ${cpi.academicYear}`}
        meta={
          <>
            <Badge tone="brand">{cpi.projectType}</Badge>
            <Badge>{cpi.participationMode === 'GROUP' ? 'Group' : 'Individual'}</Badge>
          </>
        }
      />

      <TabNav items={tabs} />

      <Outlet />
    </div>
  );
}
