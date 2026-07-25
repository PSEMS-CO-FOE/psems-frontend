import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useCpiSummary } from '@/features/courses/useCourses';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

export function LecturerCpiLayout() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiSummary(cpiId);
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">
        {cpi?.name ?? 'Course'}
        {cpi && (
          <span className="ml-2 text-xs font-normal text-gray-400">
            {cpi.department} · {cpi.academicYear}
          </span>
        )}
      </p>
      <nav className="flex gap-2">
        <NavLink to={`/lecturer/cpi/${cpiId}/sessions`} className={tabClass}>
          Sessions & scoring
        </NavLink>
        <NavLink to={`/lecturer/cpi/${cpiId}/selection`} className={tabClass}>
          Selection (supervisor)
        </NavLink>
        <NavLink to={`/lecturer/cpi/${cpiId}/availability`} className={tabClass}>
          Availability
        </NavLink>
        <NavLink to={`/lecturer/cpi/${cpiId}/review`} className={tabClass}>
          Head Judge review
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
