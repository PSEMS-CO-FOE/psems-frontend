import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';
import { NotificationsBell } from '@/components/NotificationsBell';

export function StudentLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/student">
            <h1 className="text-lg font-bold text-gray-800">PSEMS — Student</h1>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/profile/edit" className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
              My profile
            </Link>
            <NotificationsBell />
            <button
              onClick={logout}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
