import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useCpiSummary, useLecturerCpis } from '@/features/courses/useCourses';
import { PageHeader, TabNav, Badge, SkeletonCard, SkeletonText, type TabItem } from '@/components/ui';

// The lecturer's role(s) in this CPI, from their courses list. `known` is false
// both while it loads and when the CPI isn't in the list at all (a not-yet-
// accepted invite reached by URL) — which are different situations, so
// `isLoading` tells them apart.
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
  const { known, isLoading, isSupervisor, isEvaluator, isHeadJudge } = useCpiRoles(cpiId);

  // Once the roles are in, show only the tabs this lecturer can use. A CPI that
  // is not in their list at all still shows everything, so a not-yet-accepted
  // invite reached by URL is never a dead end — but that is not the same as
  // still loading, which holds the bar rather than showing every tab and then
  // taking most of them away.
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
        eyebrow={cpi && `${cpi.department} · ${cpi.academicYear}`}
        meta={cpi && <Badge tone="brand">{cpi.projectType}</Badge>}
      />

      {isLoading ? <SkeletonText className="h-9" /> : <TabNav items={tabs} />}

      <Outlet />
    </div>
  );
}
