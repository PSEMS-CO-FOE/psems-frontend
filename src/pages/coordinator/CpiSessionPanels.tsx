import { useState } from 'react';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import { useApprovedLecturers } from '@/features/lecturers/useLecturers';
import {
  useAddPanelist,
  useGuests,
  useInviteGuest,
  useRemovePanelist,
  useRevokeGuest,
  useSessionPanel,
  useUpdatePanelist,
  PANEL_ROLES,
  roleLabel,
  type MarkCounting,
  type PanelRole,
} from '@/features/panel/usePanel';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

const COUNTING_LABEL: Record<MarkCounting, string> = {
  COUNTED: 'counts',
  ADVISORY: 'advisory',
  COORDINATOR_DECIDES: 'pooled',
};

function SessionPanelCard({ cpiId, session }: { cpiId: string; session: EvaluationSession }) {
  const [open, setOpen] = useState(false);
  const { data: panel, isLoading } = useSessionPanel(cpiId, session.id, open);
  const { data: lecturers } = useApprovedLecturers();
  const add = useAddPanelist(cpiId, session.id);
  const update = useUpdatePanelist(cpiId, session.id);
  const remove = useRemovePanelist(cpiId, session.id);

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PanelRole>('EVALUATOR');

  return (
    <div className="rounded border border-gray-200 p-2">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="text-xs font-medium text-gray-800">
          {session.group.name} · {session.stage.name}
        </span>
        <span className="text-xs text-gray-400">{open ? 'hide' : 'panel'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {isLoading && <p className="text-xs text-gray-500">Loading panel…</p>}

          {panel && (
            <>
              <ul className="space-y-1">
                {panel.panelists.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-1 text-xs text-gray-700">
                    <span className="min-w-40">
                      {p.user ? personName(p.user) : p.guest?.fullName}
                      {p.guest && <span className="ml-1 rounded bg-purple-100 px-1 text-purple-700">guest</span>}
                    </span>
                    <select
                      value={p.role}
                      onChange={(e) => update.mutate({ panelistId: p.id, role: e.target.value as PanelRole })}
                      className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                    >
                      {PANEL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={p.markCounting ?? ''}
                      onChange={(e) =>
                        update.mutate({
                          panelistId: p.id,
                          markCounting: e.target.value ? (e.target.value as MarkCounting) : null,
                        })
                      }
                      className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                    >
                      <option value="">from role ({COUNTING_LABEL[p.effectiveMarkCounting]})</option>
                      <option value="COUNTED">counts</option>
                      <option value="ADVISORY">advisory only</option>
                      <option value="COORDINATOR_DECIDES">pooled</option>
                    </select>
                    {/* Relative say, not a multiplier: markers weighted 50/25/25
                        who all give 80 still produce 80. Blank = equal weight. */}
                    <label className="text-gray-500">
                      weight
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={p.weightPercent ?? ''}
                        onBlur={(e) => {
                          const raw = e.target.value.trim();
                          const next = raw === '' ? null : Number(raw);
                          if (next !== p.weightPercent) update.mutate({ panelistId: p.id, weightPercent: next });
                        }}
                        placeholder="equal"
                        className="ml-1 w-16 rounded border border-gray-300 px-1 py-0.5 text-xs"
                      />
                    </label>
                    {p.evaluation && <span className="text-green-600">submitted</span>}
                    <button
                      onClick={() => remove.mutate(p.id)}
                      className="text-red-500 hover:underline"
                      title="Removing a seat also removes that person's marks from this session"
                    >
                      remove
                    </button>
                  </li>
                ))}
                {panel.panelists.length === 0 && (
                  <li className="text-xs text-gray-500">Nobody seated yet.</li>
                )}
              </ul>

              <div className="flex flex-wrap items-center gap-1">
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                >
                  <option value="">Add a lecturer…</option>
                  {lecturers?.map((l) => (
                    <option key={l.userId} value={l.userId}>
                      {personName(l)}
                    </option>
                  ))}
                </select>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as PanelRole)}
                  className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                >
                  {PANEL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => add.mutate({ userId, role })}
                  disabled={!userId || add.isPending}
                  className="rounded bg-gray-800 px-2 py-0.5 text-xs text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  add
                </button>
              </div>
              {add.isError && <p className="text-xs text-red-600">{getApiErrorMessage(add.error)}</p>}
              {remove.isError && <p className="text-xs text-red-600">{getApiErrorMessage(remove.error)}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GuestInviter({ cpiId, sessions }: { cpiId: string; sessions: EvaluationSession[] }) {
  const { data: guests } = useGuests(cpiId);
  const invite = useInviteGuest(cpiId);
  const revoke = useRevokeGuest(cpiId);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<PanelRole>('SENIOR_EVALUATOR');
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [issuedLink, setIssuedLink] = useState<string | null>(null);

  const toggleSession = (id: string) =>
    setSessionIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const send = () =>
    invite.mutate(
      { fullName, email, organization: organization || undefined, sessionIds, role },
      {
        onSuccess: (data) => {
          setIssuedLink(`${window.location.origin}/guest?token=${data.token}`);
          setFullName('');
          setEmail('');
          setOrganization('');
          setSessionIds([]);
        },
      },
    );

  return (
    <div className="mt-4 rounded border border-gray-200 p-2">
      <p className="text-xs font-medium text-gray-700">External guests</p>
      <p className="text-xs text-gray-400">
        An industry visitor scores from a one-time link — no account. The link covers only the sessions you tick, so a
        client tied to one group never sees another.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="full name"
          className="rounded border border-gray-300 px-2 py-0.5 text-xs"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          className="rounded border border-gray-300 px-2 py-0.5 text-xs"
        />
        <input
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="organisation (optional)"
          className="rounded border border-gray-300 px-2 py-0.5 text-xs"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as PanelRole)}
          className="rounded border border-gray-300 px-1 py-0.5 text-xs"
        >
          {PANEL_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 max-h-32 space-y-0.5 overflow-y-auto pl-1">
        {sessions.map((s) => (
          <label key={s.id} className="flex items-center gap-1 text-xs text-gray-600">
            <input type="checkbox" checked={sessionIds.includes(s.id)} onChange={() => toggleSession(s.id)} />
            {s.group.name} · {s.stage.name}
          </label>
        ))}
      </div>

      <button
        onClick={send}
        disabled={!fullName || !email || sessionIds.length === 0 || invite.isPending}
        className="mt-2 rounded bg-gray-800 px-3 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {invite.isPending ? '…' : 'Create scoring link'}
      </button>
      {invite.isError && <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(invite.error)}</p>}

      {issuedLink && (
        <div className="mt-2 rounded bg-amber-50 px-2 py-2 text-xs text-amber-900">
          <p className="font-medium">Copy this link now — it cannot be shown again.</p>
          <code className="mt-1 block break-all">{issuedLink}</code>
        </div>
      )}

      {guests && guests.length > 0 && (
        <ul className="mt-3 space-y-1">
          {guests.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-1 text-xs text-gray-700">
              <span className="min-w-40">
                {g.fullName}
                {g.organization && <span className="text-gray-400"> · {g.organization}</span>}
              </span>
              <span className="text-gray-400">{g.panelSeats.length} session(s)</span>
              {g.revokedAt ? (
                <span className="rounded bg-gray-200 px-1 text-gray-600">revoked</span>
              ) : (
                <button onClick={() => revoke.mutate(g.id)} className="text-red-500 hover:underline">
                  revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Panels are per session, so each group can have a different one — different
// supervisor, different evaluators, its own guests — at the same event.
export function CpiSessionPanels({ cpiId }: { cpiId: string }) {
  const { data: sessions, isLoading } = useSessions(cpiId);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Evaluation panels</h3>
      <p className="mt-1 text-xs text-gray-500">
        Each session has its own panel. Changing one group&rsquo;s panel does not touch any other, so an unavailable
        supervisor or evaluator is a one-row swap.
      </p>

      {isLoading && <p className="mt-2 text-xs text-gray-500">Loading sessions…</p>}
      {sessions && sessions.length === 0 && (
        <p className="mt-2 text-xs text-gray-500">No sessions yet — generate them in Scheduling first.</p>
      )}

      <div className="mt-3 space-y-2">
        {sessions?.map((s) => (
          <SessionPanelCard key={s.id} cpiId={cpiId} session={s} />
        ))}
      </div>

      {sessions && sessions.length > 0 && <GuestInviter cpiId={cpiId} sessions={sessions} />}
    </div>
  );
}
