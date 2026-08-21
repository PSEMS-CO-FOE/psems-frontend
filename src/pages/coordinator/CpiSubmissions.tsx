import { useSubmissions } from '@/features/files/useSubmissions';
import { Badge, Card, EmptyState, SkeletonText } from '@/components/ui';

// Coordinator's view of every group's stage submissions, with late flags.
export function CpiSubmissions({ cpiId }: { cpiId: string }) {
  const { data: submissions, isLoading } = useSubmissions(cpiId);

  return (
    <Card title="Submissions">

      {isLoading && <SkeletonText className="mt-2" />}
      {submissions && submissions.length === 0 && (
        <EmptyState density="compact" title="No submissions yet" hint="Uploads appear here as groups submit against each stage." />
      )}

      <ul className="mt-2 divide-y">
        {submissions?.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
            <span className="text-ink">
              {s.group ? `${s.group.name} · ` : ''}
              {s.stage.name}
            </span>
            <span className="text-ink-muted">{s.fileName}</span>
            {s.isLate && (
              <Badge tone="critical">late</Badge>
            )}
            <span className="ml-auto text-ink-subtle">
              {new Date(s.submittedAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
