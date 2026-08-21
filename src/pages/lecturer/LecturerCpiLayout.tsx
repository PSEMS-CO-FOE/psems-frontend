import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useCpiSummary, useLecturerCpis } from '@/features/courses/useCourses';
import { PageHeader, TabNav, Badge, SkeletonCard, type TabItem } from '@/components/ui';

// The lecturer's role(s) in this CPI, from their courses list. While it loads
// (or if the CPI isn't in the list, e.g. a not-yet-accepted invite reached by
// URL) we don't yet know — callers default to showing everything then.
function useCpiRoles(cpiId: string) {
  const { data: cpis, isLoading } = useLecturerCpis();
  const entry = cpis?.find((c) => c.id === cpiId);
  const roles = entry?.roles ?? [];
  return {
    known: !!entry,
    isLoading,
    isSupervisor: roles.includes('Supervisor'),
    isEvaluator: roles.includes('Evaluator') || roles.includes('Head Judge'),
    isHeadJudge: roles.includes('Head Judge'),
  };
}

// Land the lecturer on a tab their role can actually use.
export function LecturerCpiIndex() {
  const { cpiId = '' } = useParams();
  const { isLoading, isSupervisor, isEvaluator, isHeadJudge } = useCpiRoles(cpiId);
  if (isLoading) return <SkeletonCard />;
  const tab = isEvaluator ? 'sessions' : isSupervisor ? 'ideas' : isHeadJudge ? 'review' : 'sessions';
  return <Navigate to={`/lecturer/cpi/${cpiId}/${tab}`} replace />;
}

export function LecturerCpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiSummary(cpiId);
  const { known, isSupervisor, isEvaluator, isHeadJudge } = useCpiRoles(cpiId);

  // Until roles are known, show all tabs so an evaluator is never blocked.
  const base = `/lecturer/cpi/${cpiId}`;
  const tabs: TabItem[] = (
    [
      { to: `${base}/sessions`, label: 'Sessions & scoring', show: !known || isEvaluator },
      { to: `${base}/ideas`, label: 'Ideas', show: !known || isSupervisor },
      { to: `${base}/selection`, label: 'Selection', show: !known || isSupervisor },
      // Supervisors fill in availability too, not just evaluators.
      { to: `${base}/availability`, label: 'Availability', show: !known || isEvaluator || isSupervisor },
      { to: `${base}/review`, label: 'Head Judge review', show: !known || isHeadJudge },
    ] satisfies (TabItem & { show: boolean })[]
  )
    .filter((t) => t.show)
    .map(({ to, label }) => ({ to, label }));

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/lecturer', label: 'My courses' }}
        title={cpi?.name ?? 'Course'}
        meta={
          cpi && (
            <>
              <Badge tone="brand">{cpi.projectType}</Badge>
              <Badge>{cpi.department}</Badge>
              <Badge>{cpi.academicYear}</Badge>
            </>
          )
        }
      />

      <TabNav items={tabs} className="border-b border-line pb-3" />

      <Outlet />
    </div>
  );
}
