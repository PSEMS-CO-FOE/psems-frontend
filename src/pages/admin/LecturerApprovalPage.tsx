import { useState } from 'react';
import {
  useBulkProvisionLecturers,
  useLecturerDecision,
  usePendingLecturers,
} from '@/features/lecturers/useLecturers';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';

// Bulk-provision lecturers the way students are provisioned. These accounts are
// auto-approved (an admin uploaded them) and carry a forced first-login password
// change, which self-registered lecturers never had.
function LecturerCsvUpload() {
  const provision = useBulkProvisionLecturers();
  const [file, setFile] = useState<File | null>(null);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Upload lecturers</h2>
      <p className="mt-1 text-xs text-ink-muted">
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
        <Button variant="primary" size="sm"
          onClick={() => file && provision.mutate(file)}
          disabled={!file || provision.isPending}>
          {provision.isPending ? '…' : 'Upload'}
        </Button>
      </div>

      {provision.isError && <Notice tone="critical" size="xs" className="mt-2">{getApiErrorMessage(provision.error)}</Notice>}
      {provision.isSuccess && (
        <div className="mt-2 text-xs">
          <p className="text-positive-700">Created {provision.data.created} lecturer(s).</p>
          {/* Rows that were skipped or malformed are reported per row, so a
              partly-bad file still provisions everyone it can. */}
          {provision.data.skipped.map((sk) => (
            <p key={sk.row} className="text-caution-700">
              Row {sk.row} ({sk.email}): {sk.reason}
            </p>
          ))}
          {provision.data.invalid.map((iv) => (
            <p key={iv.row} className="text-critical-700">
              Row {iv.row}: {iv.issues.join('; ')}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

export function LecturerApprovalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecturer approvals"
        eyebrow="System administration"
        description="Approve the accounts lecturers create before they can be given a role on a course."
      />
      <LecturerCsvUpload />
      <PendingLecturerQueue />
    </div>
  );
}

function PendingLecturerQueue() {
  const { data: lecturers, isLoading, isError, error } = usePendingLecturers();
  const decision = useLecturerDecision();

  if (isLoading) {
    return <SkeletonCard rows={3} />;
  }

  if (isError) {
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load pending lecturers')}
      </Notice>
    );
  }

  if (!lecturers || lecturers.length === 0) {
    return (
      <EmptyState
        title="Nothing awaiting approval"
        hint="Lecturers appear here after they register and before they can be given a course role."
      />
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">
        {lecturers.length} lecturer{lecturers.length === 1 ? '' : 's'} awaiting approval
      </h2>

      {decision.isError && (
        <Notice tone="critical">
          {getApiErrorMessage(decision.error, 'Action failed')}
        </Notice>
      )}

      <ul className="divide-y divide-line rounded-card border border-line bg-surface">
        {lecturers.map((lecturer) => {
          const isThisRowPending =
            decision.isPending && decision.variables?.lecturerId === lecturer.id;
          return (
            <li key={lecturer.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {lecturer.user.fullName ?? '(no name)'}
                </p>
                <p className="text-xs text-ink-muted">{lecturer.user.email}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="success"
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'approve' })
                  }>
                  Approve
                </Button>
                <Button variant="danger"
                  disabled={isThisRowPending}
                  onClick={() =>
                    decision.mutate({ lecturerId: lecturer.id, decision: 'reject' })
                  }>
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
