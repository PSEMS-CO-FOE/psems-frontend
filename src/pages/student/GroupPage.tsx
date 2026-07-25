import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  useMyGroup,
  useCreateGroup,
  useInviteMember,
  useRespondGroupInvite,
  usePendingGroupInvites,
} from '@/features/groups/useGroups';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

export function GroupPage() {
  const { cpiId = '' } = useParams();
  const email = useAuthStore((s) => s.user?.email);
  const { data, isLoading, isError, error } = useMyGroup(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading your group…</p>;
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load your group')}
      </p>
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
          <p className="rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
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
        <p className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
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
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{group.name}</h2>
        {isLeader && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">You are leader</span>
        )}
      </div>

      <ul className="mt-3 divide-y">
        {group.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2 text-xs">
            <span className="text-gray-700">
              {personName(m.student.user)}{' '}
              <span className="text-gray-400">({m.student.studentId})</span>
            </span>
            <span className="text-gray-400">{m.status}</span>
          </li>
        ))}
      </ul>

      {isLeader && !locked && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-gray-600">Invite a member by email</p>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@psems.dev"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <button
              onClick={() => invite.mutate(email, { onSuccess: () => setEmail('') })}
              disabled={!email || invite.isPending}
              className="whitespace-nowrap rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {invite.isPending ? '…' : 'Invite'}
            </button>
          </div>
          {invite.isError && (
            <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(invite.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function CreateGroupCard({ cpiId }: { cpiId: string }) {
  const create = useCreateGroup(cpiId);
  const [name, setName] = useState('');
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Create a group</h2>
      <div className="mt-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={() => create.mutate(name)}
          disabled={!name || create.isPending}
          className="whitespace-nowrap rounded bg-gray-800 px-3 py-1 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {create.isPending ? '…' : 'Create'}
        </button>
      </div>
      {create.isError && (
        <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(create.error)}</p>
      )}
    </div>
  );
}

function RespondInviteCard({ cpiId }: { cpiId: string }) {
  const respond = useRespondGroupInvite(cpiId);
  const { data: invites, isLoading } = usePendingGroupInvites(cpiId);

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Your group invitations</h2>

      {isLoading && <p className="mt-2 text-xs text-gray-500">Loading invitations…</p>}
      {invites && invites.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">You have no pending group invitations.</p>
      )}

      <ul className="mt-2 space-y-2">
        {invites?.map((inv) => (
          <li
            key={inv.groupId}
            className="flex flex-wrap items-center gap-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
          >
            <span className="text-gray-700">
              <span className="font-medium">{inv.group.name}</span>{' '}
              <span className="text-gray-400">
                (leader: {personName(inv.group.leader)})
              </span>
            </span>
            <span className="ml-auto flex gap-2">
              <button
                onClick={() => respond.mutate({ groupId: inv.groupId, decision: 'ACCEPT' })}
                disabled={respond.isPending}
                className="rounded bg-green-600 px-3 py-1 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => respond.mutate({ groupId: inv.groupId, decision: 'DECLINE' })}
                disabled={respond.isPending}
                className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Decline
              </button>
            </span>
          </li>
        ))}
      </ul>

      {respond.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(respond.error)}</p>
      )}
    </div>
  );
}
