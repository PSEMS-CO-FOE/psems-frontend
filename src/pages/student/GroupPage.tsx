import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  useMyGroup,
  useCreateGroup,
  useCreateSoloGroup,
  useInviteMember,
  useRespondGroupInvite,
  usePendingGroupInvites,
} from '@/features/groups/useGroups';
import { useCpiPolicy } from '@/features/policy/usePolicy';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Button, Card, Notice } from '@/components/ui';

export function GroupPage() {
  const { cpiId = '' } = useParams();
  const email = useAuthStore((s) => s.user?.email);
  const { data, isLoading, isError, error } = useMyGroup(cpiId);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading your group…</p>;
  if (isError) {
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load your group')}
      </Notice>
    );
  }

  const locked = data?.locked;

  if (data?.group) {
    const group = data.group;
    const myMember = group.members.find((m) => m.student.user.email === email);
    const isLeader = myMember?.student.id === group.leaderStudentId;
    return (
      <div className="space-y-4">
        {locked && (
          <p className="rounded-control bg-caution-50 px-3 py-2 text-xs text-caution-700">
            Registration is closed — the group is locked.
          </p>
        )}
        <MyGroupCard group={group} isLeader={isLeader} cpiId={cpiId} locked={!!locked} />
      </div>
    );
  }

  // No accepted group yet.
  return (
    <div className="space-y-4">
      {locked ? (
        <p className="rounded-control bg-caution-50 px-3 py-2 text-sm text-caution-700">
          Registration is closed and you are not in a group.
        </p>
      ) : (
        <>
          <CreateGroupCard cpiId={cpiId} />
          <RespondInviteCard cpiId={cpiId} />
        </>
      )}
    </div>
  );
}

function MyGroupCard({
  group,
  isLeader,
  cpiId,
  locked,
}: {
  group: import('@/features/groups/useGroups').Group;
  isLeader: boolean;
  cpiId: string;
  locked: boolean;
}) {
  const invite = useInviteMember(cpiId, group.id);
  const [email, setEmail] = useState('');

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{group.name}</h2>
        {isLeader && (
          <span className="rounded-control bg-info-50 px-2 py-0.5 text-xs text-info-700">You are leader</span>
        )}
      </div>

      <ul className="mt-3 divide-y divide-line">
        {group.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2 text-xs">
            <span className="text-ink">
              {personName(m.student.user)}{' '}
              <span className="text-ink-subtle">({m.student.studentId})</span>
            </span>
            <span className="text-ink-subtle">{m.status}</span>
          </li>
        ))}
      </ul>

      {isLeader && !locked && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-ink-muted">Invite a member by email</p>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@psems.dev"
              className="w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            />
            <Button variant="primary" size="sm" className="whitespace-nowrap"
              onClick={() => invite.mutate(email, { onSuccess: () => setEmail('') })}
              disabled={!email || invite.isPending}>
              {invite.isPending ? '…' : 'Invite'}
            </Button>
          </div>
          {invite.isError && (
            <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(invite.error)}</p>
          )}
        </div>
      )}
    </Card>
  );
}

function CreateGroupCard({ cpiId }: { cpiId: string }) {
  const create = useCreateGroup(cpiId);
  const solo = useCreateSoloGroup(cpiId);
  const { data: policy } = useCpiPolicy(cpiId);
  const [name, setName] = useState('');
  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Create a group</h2>
      {/* A guide, not a limit — the batch rarely divides evenly, so the last
          group is expected to differ and is never refused. */}
      {policy?.targetGroupSize != null && (
        <p className="mt-1 text-xs text-ink-muted">
          Groups are usually {policy.targetGroupSize}. Yours can be larger or smaller if the numbers do
          not divide evenly.
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full rounded-control border border-line-strong px-2 py-1 text-sm"
        />
        <Button variant="primary" size="sm" className="whitespace-nowrap"
          onClick={() => create.mutate(name)}
          disabled={!name || create.isPending}>
          {create.isPending ? '…' : 'Create'}
        </Button>
      </div>
      {create.isError && (
        <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(create.error)}</p>
      )}

      {/* Some courses let a student carry on alone — including group courses,
          where a student who never found a group would otherwise be stuck. */}
      <div className="mt-3 border-t pt-3">
        <p className="text-xs text-ink-muted">Taking part on your own?</p>
        <Button
          onClick={() => solo.mutate()}
          disabled={solo.isPending}
          variant="secondary"
          size="sm"
          className="mt-1"
        >
          {solo.isPending ? '…' : 'Continue without a group'}
        </Button>
        {solo.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(solo.error)}</p>}
      </div>
    </Card>
  );
}

function RespondInviteCard({ cpiId }: { cpiId: string }) {
  const respond = useRespondGroupInvite(cpiId);
  const { data: invites, isLoading } = usePendingGroupInvites(cpiId);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink">Your group invitations</h2>

      {isLoading && <p className="mt-2 text-xs text-ink-muted">Loading invitations…</p>}
      {invites && invites.length === 0 && (
        <p className="mt-1 text-xs text-ink-muted">You have no pending group invitations.</p>
      )}

      <ul className="mt-2 space-y-2">
        {invites?.map((inv) => (
          <li
            key={inv.groupId}
            className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
          >
            <span className="text-ink">
              <span className="font-medium">{inv.group.name}</span>{' '}
              <span className="text-ink-subtle">
                (leader: {personName(inv.group.leader)})
              </span>
            </span>
            <span className="ml-auto flex gap-2">
              <Button variant="success" size="sm"
                onClick={() => respond.mutate({ groupId: inv.groupId, decision: 'ACCEPT' })}
                disabled={respond.isPending}>
                Accept
              </Button>
              <Button variant="danger" size="sm"
                onClick={() => respond.mutate({ groupId: inv.groupId, decision: 'DECLINE' })}
                disabled={respond.isPending}>
                Decline
              </Button>
            </span>
          </li>
        ))}
      </ul>

      {respond.isError && (
        <p className="mt-2 text-xs text-critical-700">{getApiErrorMessage(respond.error)}</p>
      )}
    </Card>
  );
}
