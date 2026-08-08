import { Link, NavLink, Navigate, Outlet, useParams } from 'react-router-dom';
import { useCpiSummary, useLecturerCpis } from '@/features/courses/useCourses';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

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
  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  const tab = isEvaluator ? 'sessions' : isSupervisor ? 'ideas' : isHeadJudge ? 'review' : 'sessions';
  return <Navigate to={`/lecturer/cpi/${cpiId}/${tab}`} replace />;
}

export function LecturerCpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiSummary(cpiId);
  const { known, isSupervisor, isEvaluator, isHeadJudge } = useCpiRoles(cpiId);

  // Until roles are known, show all tabs so an evaluator is never blocked.
  const show = {
    sessions: !known || isEvaluator,
    ideas: !known || isSupervisor,
    selection: !known || isSupervisor,
    availability: !known || isEvaluator,
    review: !known || isHeadJudge,
  };

  return (
    <div className="space-y-4">
      <Link to="/lecturer" className="text-sm text-blue-600 hover:underline">
        ← My courses
      </Link>
      <p className="text-sm font-semibold text-gray-700">
        {cpi?.name ?? 'Course'}
        {cpi && (
          <span className="ml-2 text-xs font-normal text-gray-400">
            {cpi.department} · {cpi.academicYear}
          </span>
        )}
      </p>
      <nav className="flex flex-wrap gap-2">
        {show.sessions && (
          <NavLink to={`/lecturer/cpi/${cpiId}/sessions`} className={tabClass}>
            Sessions & scoring
          </NavLink>
        )}
        {show.ideas && (
          <NavLink to={`/lecturer/cpi/${cpiId}/ideas`} className={tabClass}>
            Ideas
          </NavLink>
        )}
        {show.selection && (
          <NavLink to={`/lecturer/cpi/${cpiId}/selection`} className={tabClass}>
            Selection (supervisor)
          </NavLink>
        )}
        {show.availability && (
          <NavLink to={`/lecturer/cpi/${cpiId}/availability`} className={tabClass}>
            Availability
          </NavLink>
        )}
        {show.review && (
          <NavLink to={`/lecturer/cpi/${cpiId}/review`} className={tabClass}>
            Head Judge review
          </NavLink>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
