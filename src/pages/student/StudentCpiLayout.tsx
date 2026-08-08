import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { useCpiSummary } from '@/features/courses/useCourses';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

export function StudentCpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiSummary(cpiId);

  return (
    <div className="space-y-4">
      <Link to="/student" className="text-sm text-blue-600 hover:underline">
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
      <nav className="flex gap-2">
        <NavLink to={`/student/cpi/${cpiId}/group`} className={tabClass}>
          Group
        </NavLink>
        <NavLink to={`/student/cpi/${cpiId}/ideas`} className={tabClass}>
          Ideas
        </NavLink>
        <NavLink to={`/student/cpi/${cpiId}/selection`} className={tabClass}>
          Selection
        </NavLink>
        <NavLink to={`/student/cpi/${cpiId}/submissions`} className={tabClass}>
          Submissions
        </NavLink>
        <NavLink to={`/student/cpi/${cpiId}/marks`} className={tabClass}>
          Marks
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
