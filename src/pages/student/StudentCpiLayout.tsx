import { NavLink, Outlet, useParams } from 'react-router-dom';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

export function StudentCpiLayout() {
  const { cpiId = '' } = useParams();

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">CPI: {cpiId}</p>
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
