import { useMemo, useState } from 'react';
import {
  useInviteSupervisor,
  useAssignEvaluator,
  useSetHeadJudge,
  useFinalizeCoordinatorManaged,
} from '@/features/courses/useCpiAssignments';
import { useApprovedLecturers } from '@/features/lecturers/useLecturers';
import type { CpiMode } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import type { UseMutationResult } from '@tanstack/react-query';

// Pick an approved lecturer by name/email (no more raw UUID pasting), then
// submit their userId to the assignment action.
function LecturerPicker({
  label,
  action,
  disabled,
  disabledReason,
}: {
  label: string;
  action: UseMutationResult<unknown, unknown, string>;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { data: lecturers, isLoading } = useApprovedLecturers(!disabled);
  const [query, setQuery] = useState('');
  const [userId, setUserId] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = lecturers ?? [];
    if (!q) return all;
    return all.filter(
      (l) =>
        (l.fullName ?? '').toLowerCase().includes(q) || l.email.toLowerCase().includes(q),
    );
  }, [lecturers, query]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lecturers by name or email"
          disabled={disabled}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
        />
        <div className="flex gap-2">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={disabled || isLoading}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs disabled:bg-gray-100"
          >
            <option value="">
              {isLoading ? 'Loading lecturers…' : `Select a lecturer (${filtered.length})`}
            </option>
            {filtered.map((l) => (
              <option key={l.userId} value={l.userId}>
                {personName(l)} — {l.email}
              </option>
            ))}
          </select>
          <button
            onClick={() => action.mutate(userId, { onSuccess: () => setUserId('') })}
            disabled={disabled || !userId || action.isPending}
            className="whitespace-nowrap rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {action.isPending ? '…' : label}
          </button>
        </div>
      </div>
      {disabled && disabledReason && (
        <p className="mt-1 text-xs text-gray-400">{disabledReason}</p>
      )}
      {action.isError && (
        <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(action.error)}</p>
      )}
    </div>
  );
}

export function CpiAssignments({ cpiId, mode }: { cpiId: string; mode: CpiMode }) {
  const inviteSupervisor = useInviteSupervisor(cpiId);
  const assignEvaluator = useAssignEvaluator(cpiId);
  const setHeadJudge = useSetHeadJudge(cpiId);
  const finalize = useFinalizeCoordinatorManaged(cpiId);

  const isCoordinatorManaged = mode === 'COORDINATOR_MANAGED';
  const isSupervisorLed = mode === 'SUPERVISOR_LED';

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Assignments <span className="font-normal text-gray-400">(during Supervisor Addition phase)</span>
      </h3>

      <div className="mt-3 space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Invite supervisor</p>
          <LecturerPicker
            label="Invite"
            action={inviteSupervisor}
            disabled={isCoordinatorManaged}
            disabledReason="CPI is finalized as Coordinator-Managed."
          />
          <p className="mt-1 text-xs text-gray-400">
            The first invite locks this CPI into Supervisor-Led mode.
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Assign evaluator</p>
          <LecturerPicker label="Assign" action={assignEvaluator} />
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Set Head Judge</p>
          <LecturerPicker label="Set" action={setHeadJudge} />
          <p className="mt-1 text-xs text-gray-400">Must already be an evaluator.</p>
        </div>

        <div className="border-t pt-3">
          <p className="mb-1 text-xs font-medium text-gray-600">No supervisors?</p>
          <button
            onClick={() => finalize.mutate('')}
            disabled={isSupervisorLed || isCoordinatorManaged || finalize.isPending}
            className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {finalize.isPending ? '…' : 'Finalize as Coordinator-Managed'}
          </button>
          {isSupervisorLed && (
            <p className="mt-1 text-xs text-gray-400">
              Already Supervisor-Led — can't finalize as Coordinator-Managed.
            </p>
          )}
          {finalize.isError && (
            <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(finalize.error)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
