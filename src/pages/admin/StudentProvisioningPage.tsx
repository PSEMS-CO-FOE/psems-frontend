import { useRef, useState } from 'react';
import {
  useBulkProvision,
  useBatchStatus,
} from '@/features/students/useProvisioning';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, Notice, PageHeader } from '@/components/ui';

// registrationNumber may be left blank; mark sheets print it beside the index
// number and show a dash without it.
const SAMPLE_CSV = `email,fullName,studentId,registrationNumber,department,year
alice.demo@psems.dev,Alice Demo,STU9001,2022/E/001,Computer Engineering,4
bob.demo@psems.dev,Bob Demo,STU9002,,Computer Engineering,3
`;

function StatusPill({ status }: { status: string }) {
  const color =
    status === 'SENT'
      ? 'bg-positive-50 text-positive-700'
      : status === 'FAILED'
      ? 'bg-critical-50 text-critical-700'
      : 'bg-caution-50 text-caution-700';
  return <span className={`rounded-control px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
}

export function StudentProvisioningPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const provision = useBulkProvision();
  const batch = useBatchStatus(batchId);

  const onUpload = () => {
    if (!file) return;
    provision.mutate(file, {
      onSuccess: (result) => setBatchId(result.batchId),
    });
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLE_CSV], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const result = provision.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student provisioning"
        description="Create student accounts in bulk from a CSV. Each one is emailed a temporary password and must change it at first sign-in."
      />

      <Card title="Upload a CSV">
        <p className="text-xs text-ink-muted">
          Upload a CSV with header{' '}
          <code className="rounded-control bg-canvas px-1">
            email,fullName,studentId,registrationNumber,department,year
          </code>
          . The registration number may be blank, but mark sheets carry it beside the index number. Each
          student gets a temp password emailed to them.{' '}
          <button onClick={downloadSample} className="text-brand-700 underline">
            Download sample
          </button>
        </p>

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <Button variant="primary"
            onClick={onUpload}
            disabled={!file || provision.isPending}>
            {provision.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>

        {provision.isError && (
          <Notice tone="critical" className="mt-3">
            {getApiErrorMessage(provision.error, 'Upload failed')}
          </Notice>
        )}
      </Card>

      {/* Upload result: created / skipped / invalid */}
      {result && (
        <Card>
          <h3 className="text-sm font-semibold text-ink">
            Upload result — {result.created} created
          </h3>

          {result.skipped.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-ink-muted">
                Skipped ({result.skipped.length})
              </p>
              <ul className="mt-1 space-y-1">
                {result.skipped.map((s) => (
                  <li key={`${s.row}-${s.email}`} className="text-xs text-ink-muted">
                    Row {s.row} — {s.email}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.invalid.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-critical-700">
                Invalid ({result.invalid.length})
              </p>
              <ul className="mt-1 space-y-1">
                {result.invalid.map((v) => (
                  <li key={v.row} className="text-xs text-critical-700">
                    Row {v.row}: {v.issues.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Email delivery status (polls while queued) */}
      {batchId && batch.data && (
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Email delivery</h3>
            {batch.data.queued > 0 && (
              <span className="text-xs text-ink-subtle">polling…</span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {batch.data.total} total · {batch.data.sent} sent · {batch.data.failed} failed ·{' '}
            {batch.data.queued} queued
          </p>

          <ul className="mt-3 divide-y">
            {batch.data.students.map((s) => (
              <li key={s.email} className="flex items-center justify-between py-2">
                <span className="text-xs text-ink">{s.email}</span>
                <StatusPill status={s.deliveryStatus} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
