import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvaluationConfig, type SavedStage } from '@/features/evaluations/useEvaluationConfig';
import { useSubmissions, useSubmitProposal } from '@/features/files/useSubmissions';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, EmptyState, SkeletonText } from '@/components/ui';

function StageUpload({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const submit = useSubmitProposal(cpiId);
  const [file, setFile] = useState<File | null>(null);

  return (
    <Card>
      <p className="text-sm font-medium text-ink">{stage.name}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
        <Button variant="primary" size="sm"
          onClick={() => file && submit.mutate({ stageId: stage.id, file })}
          disabled={!file || submit.isPending}>
          {submit.isPending ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {submit.isError && (
        <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(submit.error)}</p>
      )}
    </Card>
  );
}

export function SubmissionsPage() {
  const { cpiId = '' } = useParams();
  const { data: config, isLoading: loadingConfig } = useEvaluationConfig(cpiId);
  const { data: submissions } = useSubmissions(cpiId);

  const submissionStages = (config ?? []).filter((s) => s.submissionRequired);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Submit a proposal</h2>
        {loadingConfig && <SkeletonText />}
        {config && submissionStages.length === 0 && (
          <EmptyState
            density="compact"
            title="Nothing to submit right now"
            hint="Stages that need a file appear here once your coordinator opens their submission window."
          />
        )}
        <div className="space-y-2">
          {submissionStages.map((stage) => (
            <StageUpload key={stage.id} cpiId={cpiId} stage={stage} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Your submissions</h2>
        {submissions && submissions.length === 0 && (
          <EmptyState density="compact" title="Nothing submitted yet" hint="Upload your file before the stage’s deadline; a late upload is accepted but flagged." />
        )}
        <ul className="space-y-1">
          {submissions?.map((s) => (
            <li key={s.id} className="rounded-control border bg-surface px-3 py-2 text-xs text-ink">
              {s.stage.name}: {s.fileName} ({Math.round(s.fileSize / 1024)} KB)
              {s.isLate && <Badge tone="critical" className="ml-2">late</Badge>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
