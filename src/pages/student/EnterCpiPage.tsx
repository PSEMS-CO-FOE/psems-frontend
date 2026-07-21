import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Students have no CPI-discovery endpoint yet, so they enter the CPI id they
// were given (by their coordinator) to open its group/ideas/selection screens.
export function EnterCpiPage() {
  const [cpiId, setCpiId] = useState('');
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="text-sm font-semibold text-gray-700">Open a course instance</h2>
      <p className="mt-1 text-xs text-gray-500">
        Enter the CPI id your coordinator gave you.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (cpiId.trim()) navigate(`/student/cpi/${cpiId.trim()}/group`);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={cpiId}
          onChange={(e) => setCpiId(e.target.value)}
          placeholder="CPI id (UUID)"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!cpiId.trim()}
          className="whitespace-nowrap rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Open
        </button>
      </form>
    </div>
  );
}
