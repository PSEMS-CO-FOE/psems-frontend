import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useAddCoSupervisor,
  useIdeas,
  usePostIdea,
  useRemoveCoSupervisor,
  useRespondCoSupervisor,
  type Idea,
} from '@/features/ideas/useIdeas';
import { useApprovedLecturers } from '@/features/lecturers/useLecturers';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { personName, shortName } from '@/lib/name';
import { Button, Card, EmptyState, Notice, SkeletonText } from '@/components/ui';
import { PolicyNote } from '@/components/PolicyNote';

// Supervisor idea announcement (Supervisor-Led mode): an accepted supervisor
// posts project ideas for groups to express interest in, and sees the CPI's
// ideas. The backend authorizes posting by supervisor capacity.

// Who would actually supervise this, and who is still deciding. The primary
// supervisor can take a co-supervisor off again — inviting one was always
// possible, undoing it was not, so a mistaken invite stuck permanently.
function SupervisorChips({ cpiId, idea }: { cpiId: string; idea: Idea }) {
  const remove = useRemoveCoSupervisor(cpiId);
  if (!idea.supervisors || idea.supervisors.length === 0) return null;

  return (
    <>
      <ul className="mt-1 flex flex-wrap gap-1">
        {idea.supervisors.map((sup) => (
          <li
            key={sup.id}
            className={`flex items-center gap-1 rounded-control px-2 py-0.5 text-xs ${
              sup.invitationStatus === 'ACCEPTED'
                ? 'bg-positive-50 text-positive-700'
                : sup.invitationStatus === 'PENDING'
                  ? 'bg-caution-50 text-caution-700'
                  : 'bg-canvas text-ink-muted'
            }`}
          >
            <span>
              {shortName(personName(sup.lecturer.user))}
              {sup.isPrimary ? ' · supervisor' : ' · co-supervisor'}
              {sup.invitationStatus === 'PENDING' && ' (not yet accepted)'}
              {sup.invitationStatus === 'DECLINED' && ' (declined)'}
            </span>
            {!sup.isPrimary && (
              <button
                onClick={() => remove.mutate({ ideaId: idea.id, coSupervisorId: sup.id })}
                disabled={remove.isPending}
                aria-label={`Remove ${personName(sup.lecturer.user)} as co-supervisor`}
                title="Remove this co-supervisor"
                className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {remove.isError && <p className="mt-1 text-xs text-critical-700">{getApiErrorMessage(remove.error)}</p>}
    </>
  );
}

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
        className="rounded-control border border-line-strong px-1 py-0.5 text-xs"
      >
        <option value="">Add a co-supervisor…</option>
        {lecturers?.map((l) => (
          <option key={l.userId} value={l.userId}>
            {personName(l)}
          </option>
        ))}
      </select>
      <Button variant="neutral" size="sm"
        onClick={() => add.mutate({ ideaId: idea.id, lecturerUserId })}
        disabled={!lecturerUserId || add.isPending}>
        invite
      </Button>

      {myInvite && (
        <>
          <Button variant="success" size="sm"
            onClick={() => respond.mutate({ ideaId: idea.id, decision: 'ACCEPT' })}>
            accept co-supervision
          </Button>
          <Button
            onClick={() => respond.mutate({ ideaId: idea.id, decision: 'DECLINE' })}
            variant="secondary"
            size="sm"
          >
            decline
          </Button>
        </>
      )}

      {add.isError && <span className="text-xs text-critical-700">{getApiErrorMessage(add.error)}</span>}
      {respond.isError && <span className="text-xs text-critical-700">{getApiErrorMessage(respond.error)}</span>}
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
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.allowSupervisorIdeas
            ? 'Supervisors post ideas on this course.'
            : 'Supervisors are not posting ideas on this course.',
          p.allowCoSupervisorOnIdea
            ? 'You may name a co-supervisor on an idea you post.'
            : 'Ideas cannot name a co-supervisor here.',
          p.allowCoSupervisionInterest && 'You may offer to co-supervise another lecturer’s idea.',
          p.allowLecturerInterestInGroupIdeas && 'You may express interest in a group’s own idea.',
        ]}
      />
      <Card>
        <h2 className="text-sm font-semibold text-ink">Announce a project idea</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Post ideas for groups to express interest in (Supervisor-Led mode, during Idea Announcement).
        </p>
        {postIdea.isError && (
          <Notice tone="critical" size="xs" className="mt-2">
            {getApiErrorMessage(postIdea.error, 'Could not post idea')}
          </Notice>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Idea title"
          className="mt-2 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the idea"
          rows={3}
          className="mt-2 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
        />
        <Button variant="primary" className="mt-2"
          onClick={submit}
          disabled={!title || !description || postIdea.isPending}>
          {postIdea.isPending ? 'Posting…' : 'Post idea'}
        </Button>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Ideas in this course</h2>
        {isLoading && <SkeletonText />}
        {isError && getApiErrorStatus(error) === 403 && (
          <EmptyState
            title="You are not a supervisor on this course"
            hint="Only an accepted supervisor or the coordinator can post and read ideas here. If you were invited, accept the invitation from My courses first."
          />
        )}
        {isError && getApiErrorStatus(error) !== 403 && (
          <Notice tone="critical">
            {getApiErrorMessage(error, 'Could not load ideas')}
          </Notice>
        )}
        {ideas && ideas.length === 0 && (
          <EmptyState
            title="No ideas posted yet"
            hint="Post one above while the idea announcement phase is open; groups pick from what is here."
          />
        )}
        {ideas && ideas.length > 0 && (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <li key={idea.id} className="rounded-card border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{idea.title}</p>
                  <span className="rounded-control bg-canvas-sunken px-2 py-0.5 text-xs text-ink-muted">{idea.authorType}</span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{idea.description}</p>
                <p className="mt-2 text-xs text-ink-subtle">
                  by {shortName(personName(idea.author))}
                  {idea.group && ` · ${idea.group.name}`}
                </p>

                <SupervisorChips cpiId={cpiId} idea={idea} />

                <CoSupervisorControls cpiId={cpiId} idea={idea} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
