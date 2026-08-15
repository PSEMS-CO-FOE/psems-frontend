import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useAddCoSupervisor,
  useIdeas,
  usePostIdea,
  useRespondCoSupervisor,
  type Idea,
} from '@/features/ideas/useIdeas';
import { useApprovedLecturers } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { personName } from '@/lib/name';

// Supervisor idea announcement (Supervisor-Led mode): an accepted supervisor
// posts project ideas for groups to express interest in, and sees the CPI's
// ideas. The backend authorizes posting by supervisor capacity.

// Naming a co-supervisor invites them — they have to accept before a group sees
// them as attached. Only the idea's own supervisor may edit the list, so the
// server rejects this for anyone else and the error is surfaced inline.
function CoSupervisorControls({ cpiId, idea }: { cpiId: string; idea: Idea }) {
  const { data: lecturers } = useApprovedLecturers();
  const add = useAddCoSupervisor(cpiId);
  const respond = useRespondCoSupervisor(cpiId);
  const [lecturerUserId, setLecturerUserId] = useState('');

  const myInvite = idea.supervisors?.find((s) => !s.isPrimary && s.invitationStatus === 'PENDING');

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <select
        value={lecturerUserId}
        onChange={(e) => setLecturerUserId(e.target.value)}
        className="rounded border border-gray-300 px-1 py-0.5 text-xs"
      >
        <option value="">Add a co-supervisor…</option>
        {lecturers?.map((l) => (
          <option key={l.userId} value={l.userId}>
            {personName(l)}
          </option>
        ))}
      </select>
      <button
        onClick={() => add.mutate({ ideaId: idea.id, lecturerUserId })}
        disabled={!lecturerUserId || add.isPending}
        className="rounded bg-gray-700 px-2 py-0.5 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
      >
        invite
      </button>

      {myInvite && (
        <>
          <button
            onClick={() => respond.mutate({ ideaId: idea.id, decision: 'ACCEPT' })}
            className="rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700"
          >
            accept co-supervision
          </button>
          <button
            onClick={() => respond.mutate({ ideaId: idea.id, decision: 'DECLINE' })}
            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            decline
          </button>
        </>
      )}

      {add.isError && <span className="text-xs text-red-600">{getApiErrorMessage(add.error)}</span>}
      {respond.isError && <span className="text-xs text-red-600">{getApiErrorMessage(respond.error)}</span>}
    </div>
  );
}

export function LecturerIdeasPage() {
  const { cpiId = '' } = useParams();
  const { data: ideas, isLoading, isError, error } = useIdeas(cpiId);
  const postIdea = usePostIdea(cpiId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const submit = () =>
    postIdea.mutate(
      { title, description },
      { onSuccess: () => { setTitle(''); setDescription(''); } },
    );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Announce a project idea</h2>
        <p className="mt-1 text-xs text-gray-500">
          Post ideas for groups to express interest in (Supervisor-Led mode, during Idea Announcement).
        </p>
        {postIdea.isError && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
            {getApiErrorMessage(postIdea.error, 'Could not post idea')}
          </p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Idea title"
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the idea"
          rows={3}
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={!title || !description || postIdea.isPending}
          className="mt-2 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {postIdea.isPending ? 'Posting…' : 'Post idea'}
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Ideas in this course</h2>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && getApiErrorStatus(error) === 403 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
            Only an accepted supervisor or the coordinator can post and view ideas here. If you were
            invited to supervise, accept the invitation from <span className="font-medium">← My courses</span> first.
          </p>
        )}
        {isError && getApiErrorStatus(error) !== 403 && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(error, 'Could not load ideas')}
          </p>
        )}
        {ideas && ideas.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No ideas posted yet.
          </p>
        )}
        {ideas && ideas.length > 0 && (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <li key={idea.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{idea.title}</p>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{idea.authorType}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{idea.description}</p>
                <p className="mt-2 text-xs text-gray-400">
                  by {personName(idea.author)}
                  {idea.group && ` · ${idea.group.name}`}
                </p>

                {/* Who would actually supervise this, and who is still deciding. */}
                {idea.supervisors && idea.supervisors.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {idea.supervisors.map((sup) => (
                      <li
                        key={sup.id}
                        className={`rounded px-2 py-0.5 text-xs ${
                          sup.invitationStatus === 'ACCEPTED'
                            ? 'bg-green-50 text-green-800'
                            : sup.invitationStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {personName(sup.lecturer.user)}
                        {sup.isPrimary ? ' · supervisor' : ' · co-supervisor'}
                        {sup.invitationStatus === 'PENDING' && ' (not yet accepted)'}
                        {sup.invitationStatus === 'DECLINED' && ' (declined)'}
                      </li>
                    ))}
                  </ul>
                )}

                <CoSupervisorControls cpiId={cpiId} idea={idea} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
