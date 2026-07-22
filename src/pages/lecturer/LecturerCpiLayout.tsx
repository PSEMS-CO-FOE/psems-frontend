import { NavLink, Outlet, useParams } from 'react-router-dom';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

export function LecturerCpiLayout() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">CPI: {cpiId}</p>
      <nav className="flex gap-2">
        <NavLink to={`/lecturer/cpi/${cpiId}/sessions`} className={tabClass}>
          Sessions & scoring
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
