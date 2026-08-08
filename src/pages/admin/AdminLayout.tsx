import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';
import { NotificationsBell } from '@/components/NotificationsBell';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium rounded ${
    isActive ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
  }`;

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">PSEMS — System Admin</h1>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <button
              onClick={logout}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-2 px-4 pb-3">
          <NavLink to="/admin/lecturers" className={tabClass}>
            Lecturer Approvals
          </NavLink>
          <NavLink to="/admin/students" className={tabClass}>
            Student Provisioning
          </NavLink>
          <NavLink to="/admin/coordinators" className={tabClass}>
            Coordinators
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
