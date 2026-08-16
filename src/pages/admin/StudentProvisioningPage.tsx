import { useRef, useState } from 'react';
import {
  useBulkProvision,
  useBatchStatus,
} from '@/features/students/useProvisioning';
import { getApiErrorMessage } from '@/lib/apiError';

// registrationNumber may be left blank; mark sheets print it beside the index
// number and show a dash without it.
const SAMPLE_CSV = `email,fullName,studentId,registrationNumber,department,year
alice.demo@psems.dev,Alice Demo,STU9001,2022/E/001,Computer Engineering,4
bob.demo@psems.dev,Bob Demo,STU9002,,Computer Engineering,3
`;

function StatusPill({ status }: { status: string }) {
  const color =
    status === 'SENT'
      ? 'bg-green-100 text-green-700'
      : status === 'FAILED'
      ? 'bg-red-100 text-red-700'
      : 'bg-yellow-100 text-yellow-700';
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>;
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
      {/* Upload card */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Bulk provision students</h2>
        <p className="mt-1 text-xs text-gray-500">
          Upload a CSV with header{' '}
          <code className="rounded bg-gray-100 px-1">
            email,fullName,studentId,registrationNumber,department,year
          </code>
          . The registration number may be blank, but mark sheets carry it beside the index number. Each
          student gets a temp password emailed to them.{' '}
          <button onClick={downloadSample} className="text-blue-600 underline">
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
          <button
            onClick={onUpload}
            disabled={!file || provision.isPending}
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {provision.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {provision.isError && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(provision.error, 'Upload failed')}
          </p>
        )}
      </div>

      {/* Upload result: created / skipped / invalid */}
      {result && (
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Upload result — {result.created} created
          </h3>

          {result.skipped.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600">
                Skipped ({result.skipped.length})
              </p>
              <ul className="mt-1 space-y-1">
                {result.skipped.map((s) => (
                  <li key={`${s.row}-${s.email}`} className="text-xs text-gray-500">
                    Row {s.row} — {s.email}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.invalid.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-red-600">
                Invalid ({result.invalid.length})
              </p>
              <ul className="mt-1 space-y-1">
                {result.invalid.map((v) => (
                  <li key={v.row} className="text-xs text-red-500">
                    Row {v.row}: {v.issues.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Email delivery status (polls while queued) */}
      {batchId && batch.data && (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Email delivery</h3>
            {batch.data.queued > 0 && (
              <span className="text-xs text-gray-400">polling…</span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {batch.data.total} total · {batch.data.sent} sent · {batch.data.failed} failed ·{' '}
            {batch.data.queued} queued
          </p>

          <ul className="mt-3 divide-y">
            {batch.data.students.map((s) => (
              <li key={s.email} className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-700">{s.email}</span>
                <StatusPill status={s.deliveryStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
