import { useAuditLog } from '@/features/superAdmin/useSuperAdmin';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';

function toneFor(status: number) {
  if (status >= 500) return 'critical' as const;
  if (status >= 400) return 'caution' as const;
  return 'positive' as const;
}

export function SuperAdminAuditPage() {
  const { data: entries, isLoading, isError, error } = useAuditLog(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every change anyone makes: who did it, what they touched and the outcome. What was sent is hashed, never stored, so this records the act without keeping the contents."
      />

      {isLoading && <SkeletonCard rows={5} />}
      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load the audit log')}</Notice>
      )}

      {entries && entries.length === 0 && (
        <EmptyState
          title="Nothing recorded yet"
          hint="Entries appear as soon as anyone changes something in the system."
        />
      )}

      {entries && entries.length > 0 && (
        <Card title="Most recent" description={`Last ${entries.length} changes.`} flush>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">When</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Who</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Action</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums text-ink-muted">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {/* Null once the account is gone: the log outlives the
                          person, which is the point of keeping it. */}
                      {entry.actor ? (
                        <span className="text-ink">{entry.actor.fullName || entry.actor.email}</span>
                      ) : (
                        <span className="text-ink-subtle">Account removed</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-ink">{entry.action}</td>
                    <td className="px-4 py-2">
                      <Badge tone={toneFor(entry.statusCode)}>{entry.statusCode}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
