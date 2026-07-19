import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';

// Stand-in for not-yet-built screens.
export function PlaceholderPage({ title }: { title: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Placeholder screen — not built yet.
        </p>
        {user && (
          <p className="mt-4 text-sm text-gray-700">
            Signed in as <span className="font-medium">{user.email}</span> (
            {user.role})
          </p>
        )}
        <button
          onClick={logout}
          className="mt-6 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
