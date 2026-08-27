import { useState } from 'react';
import { useSubmissions } from '@/features/files/useSubmissions';
import { ProposalAnalysisPanel } from '@/features/ml/ProposalAnalysisPanel';
import { Badge, Button, Card, EmptyState, SkeletonText } from '@/components/ui';

// Coordinator's view of every group's stage submissions, with late flags.
export function CpiSubmissions({ cpiId }: { cpiId: string }) {
  const { data: submissions, isLoading } = useSubmissions(cpiId);
  // One submission is inspected at a time; analysis is slow enough that a panel
  // per row would invite several concurrent runs.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = submissions?.find((s) => s.id === selectedId);

  return (
    <div className="space-y-4">
      <Card title="Submissions">
        {isLoading && <SkeletonText className="mt-2" />}
        {submissions && submissions.length === 0 && (
          <EmptyState density="compact" title="No submissions yet" hint="Uploads appear here as groups submit against each stage." />
        )}

        <ul className="mt-2 divide-y divide-line">
          {submissions?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
              <span className="text-ink">
                {s.group ? `${s.group.name} · ` : ''}
                {s.stage.name}
              </span>
              <span className="text-ink-muted">{s.fileName}</span>
              {s.isLate && <Badge tone="critical">late</Badge>}
              <span className="ml-auto text-ink-subtle">
                {new Date(s.submittedAt).toLocaleString()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
              >
                {s.id === selectedId ? 'Hide' : 'Inspect'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {selected && (
        <ProposalAnalysisPanel
          cpiId={cpiId}
          submissionId={selected.id}
          fileName={selected.fileName}
        />
      )}
    </div>
  );
}
