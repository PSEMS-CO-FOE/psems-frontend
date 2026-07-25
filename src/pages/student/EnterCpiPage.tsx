import { useNavigate } from 'react-router-dom';
import { useStudentCpis } from '@/features/courses/useCourses';
import { getApiErrorMessage } from '@/lib/apiError';

// Students pick from the CPIs available to them (their department + any they've
// joined) — no CPI id to type.
export function EnterCpiPage() {
  const navigate = useNavigate();
  const { data: cpis, isLoading, isError, error } = useStudentCpis();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700">Your courses</h2>
      <p className="mt-1 text-xs text-gray-500">
        Open a course to form your group, browse ideas, and track your project.
      </p>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading your courses…</p>}
      {isError && (
        <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {getApiErrorMessage(error, 'Could not load your courses')}
        </p>
      )}
      {cpis && cpis.length === 0 && (
        <p className="mt-3 text-xs text-gray-500">
          No courses are open for your department yet. Check back once your coordinator sets one up.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {cpis?.map((cpi) => (
          <li key={cpi.id}>
            <button
              onClick={() => navigate(`/student/cpi/${cpi.id}/group`)}
              className="flex w-full items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
            >
              <span>
                <span className="text-sm font-medium text-gray-800">{cpi.name}</span>
                <span className="block text-xs text-gray-400">
                  {cpi.department} · {cpi.academicYear}
                </span>
              </span>
              <span className="text-xs text-gray-500">Open →</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
