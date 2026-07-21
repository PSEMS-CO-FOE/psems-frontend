import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvaluationConfig, type SavedStage } from '@/features/evaluations/useEvaluationConfig';
import { useSubmissions, useSubmitProposal } from '@/features/files/useSubmissions';
import { getApiErrorMessage } from '@/lib/apiError';

function StageUpload({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const submit = useSubmitProposal(cpiId);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-sm font-medium text-gray-800">{stage.name}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
        <button
          onClick={() => file && submit.mutate({ stageId: stage.id, file })}
          disabled={!file || submit.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submit.isPending ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {submit.isError && (
        <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(submit.error)}</p>
      )}
    </div>
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
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Submit a proposal</h2>
        {loadingConfig && <p className="text-sm text-gray-500">Loading stages…</p>}
        {config && submissionStages.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No stages currently require a submission.
          </p>
        )}
        <div className="space-y-2">
          {submissionStages.map((stage) => (
            <StageUpload key={stage.id} cpiId={cpiId} stage={stage} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Your submissions</h2>
        {submissions && submissions.length === 0 && (
          <p className="text-xs text-gray-500">Nothing submitted yet.</p>
        )}
        <ul className="space-y-1">
          {submissions?.map((s) => (
            <li key={s.id} className="rounded border bg-white px-3 py-2 text-xs text-gray-700">
              {s.stage.name}: {s.fileName} ({Math.round(s.fileSize / 1024)} KB)
              {s.isLate && <span className="ml-2 rounded bg-red-100 px-1 text-red-700">LATE</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
