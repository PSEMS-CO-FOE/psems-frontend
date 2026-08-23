import { Outlet, useParams } from 'react-router-dom';
import { useCpiSummary } from '@/features/courses/useCourses';
import { PageHeader, TabNav, Badge } from '@/components/ui';

export function StudentCpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiSummary(cpiId);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/student', label: 'My courses' }}
        title={cpi?.name ?? 'Course'}
        eyebrow={cpi && `${cpi.department} · ${cpi.academicYear}`}
        meta={cpi && <Badge tone="brand">{cpi.projectType}</Badge>}
      />

      <TabNav
        items={[
          { to: `/student/cpi/${cpiId}/group`, label: 'Group' },
          { to: `/student/cpi/${cpiId}/ideas`, label: 'Ideas' },
          { to: `/student/cpi/${cpiId}/selection`, label: 'Selection' },
          { to: `/student/cpi/${cpiId}/submissions`, label: 'Submissions' },
          { to: `/student/cpi/${cpiId}/schedule`, label: 'Schedule' },
          { to: `/student/cpi/${cpiId}/marks`, label: 'Marks' },
        ]}
      />

      <Outlet />
    </div>
  );
}
