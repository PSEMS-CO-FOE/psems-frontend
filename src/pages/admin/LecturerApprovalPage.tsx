import { useState } from 'react';
import {
  useBulkProvisionLecturers,
  useLecturerDecision,
  usePendingLecturers,
} from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';

// Bulk-provision lecturers the way students are provisioned. These accounts are
// auto-approved (an admin uploaded them) and carry a forced first-login password
// change, which self-registered lecturers never had.
function LecturerCsvUpload() {
  const provision = useBulkProvisionLecturers();
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Upload lecturers</h2>
      <p className="mt-1 text-xs text-gray-500">
        CSV with header <code>email,fullName,department,designation</code>. Designation is optional. Each lecturer gets
        a temporary password by email and must change it on first sign-in.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
        <button
          onClick={() => file && provision.mutate(file)}
          disabled={!file || provision.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {provision.isPending ? '…' : 'Upload'}
        </button>
      </div>

      {provision.isError && <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(provision.error)}</p>}
      {provision.isSuccess && (
        <div className="mt-2 text-xs">
          <p className="text-green-700">Created {provision.data.created} lecturer(s).</p>
          {/* Rows that were skipped or malformed are reported per row, so a
              partly-bad file still provisions everyone it can. */}
          {provision.data.skipped.map((sk) => (
            <p key={sk.row} className="text-amber-700">
              Row {sk.row} ({sk.email}): {sk.reason}
            </p>
          ))}
          {provision.data.invalid.map((iv) => (
            <p key={iv.row} className="text-red-600">
              Row {iv.row}: {iv.issues.join('; ')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function LecturerApprovalPage() {
  return (
    <div className="space-y-4">
      <LecturerCsvUpload />
      <PendingLecturerQueue />
    </div>
  );
}

function PendingLecturerQueue() {
  const { data: lecturers, isLoading, isError, error } = usePendingLecturers();
  const decision = useLecturerDecision();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading pending lecturers…</p>;
  }

  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load pending lecturers')}
      </p>
    );
  }

  if (!lecturers || lecturers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No lecturers awaiting approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">
        {lecturers.length} lecturer{lecturers.length === 1 ? '' : 's'} awaiting approval
      </h2>

      {decision.isError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(decision.error, 'Action failed')}
        </p>
      )}

      <ul className="divide-y rounded-lg border bg-white">
        {lecturers.map((lecturer) => {
          const isThisRowPending =
            decision.isPending && decision.variables?.lecturerId === lecturer.id;
          return (
            <li key={lecturer.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {lecturer.user.fullName ?? '(no name)'}
                </p>
                <p className="text-xs text-gray-500">{lecturer.user.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'approve' })
                  }
                  className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'reject' })
                  }
                  className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
