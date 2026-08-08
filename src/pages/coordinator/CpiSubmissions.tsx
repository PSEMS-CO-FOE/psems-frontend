import { useSubmissions } from '@/features/files/useSubmissions';

// Coordinator's view of every group's stage submissions, with late flags.
export function CpiSubmissions({ cpiId }: { cpiId: string }) {
  const { data: submissions, isLoading } = useSubmissions(cpiId);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Submissions</h3>

      {isLoading && <p className="mt-2 text-xs text-gray-500">Loading…</p>}
      {submissions && submissions.length === 0 && (
        <p className="mt-2 text-xs text-gray-500">No submissions yet.</p>
      )}

      <ul className="mt-2 divide-y">
        {submissions?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
            <span className="text-gray-700">
              {s.group ? `${s.group.name} · ` : ''}
              {s.stage.name}
            </span>
            <span className="text-gray-500">{s.fileName}</span>
            {s.isLate && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">late</span>
            )}
            <span className="ml-auto text-gray-400">
              {new Date(s.submittedAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
