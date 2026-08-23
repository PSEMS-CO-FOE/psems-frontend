import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIdeas, usePostIdea, useUpdateIdea, type Idea } from '@/features/ideas/useIdeas';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import { Button, Card, EmptyState, Notice, SkeletonText } from '@/components/ui';
import { PolicyNote } from '@/components/PolicyNote';

function IdeaCard({ cpiId, idea }: { cpiId: string; idea: Idea }) {
  // A student only ever sees their own group's student-authored ideas, so any
  // STUDENT idea here is editable by the group.
  const editable = idea.authorType === 'STUDENT';
  const update = useUpdateIdea(cpiId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description);

  const save = () =>
    update.mutate(
      { ideaId: idea.id, title, description },
      { onSuccess: () => setEditing(false) },
    );

  return (
    <li className="rounded-card border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{idea.title}</p>
        <span className="rounded-control bg-canvas-sunken px-2 py-0.5 text-xs text-ink-muted">{idea.authorType}</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{idea.description}</p>
      <p className="mt-2 text-xs text-ink-subtle">
        by {personName(idea.author)}
        {idea.group && ` · ${idea.group.name}`}
        {idea.approvalStatus && ` · ${idea.approvalStatus.replace('_', ' ')}`}
      </p>

      {idea.approvalStatus === 'REVISION_REQUESTED' && idea.revisionNote && (
        <p className="mt-2 rounded-control bg-caution-50 px-3 py-2 text-xs text-caution-700">
          Revision requested: {idea.revisionNote}
        </p>
      )}

      {editable && !editing && idea.approvalStatus !== 'APPROVED' && idea.approvalStatus !== 'REJECTED' && (
        <Button
          onClick={() => setEditing(true)}
          variant="secondary"
          size="sm"
          className="mt-2"
        >
          Edit &amp; resubmit
        </Button>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-control border border-line-strong px-2 py-1 text-xs"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-control border border-line-strong px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm"
              onClick={save}
              disabled={!title || !description || update.isPending}>
              {update.isPending ? '…' : 'Resubmit'}
            </Button>
            <Button
              onClick={() => setEditing(false)}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          {update.isError && (
            <p className="text-xs text-critical-700">{getApiErrorMessage(update.error)}</p>
          )}
        </div>
      )}
    </li>
  );
}

export function IdeasPage() {
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
      {/* Stated up front because these two settings are the difference between
          "post" working and returning a refusal a student cannot explain. */}
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          !p.allowStudentIdeas && 'Students are not posting ideas on this course.',
          p.allowStudentIdeas &&
            p.studentIdeasLeaderOnly &&
            'Only your group leader can post the group’s idea.',
          p.allowStudentIdeas &&
            p.requireStudentIdeaApproval &&
            'Ideas you post wait for the coordinator’s approval.',
          p.maxIdeasPerGroup !== null && `Your group may post at most ${p.maxIdeasPerGroup} idea(s).`,
          p.allowStudentIdeas &&
            (p.studentsSeeOtherGroupIdeas
              ? 'You can see other groups’ ideas.'
              : 'Other groups’ ideas are not visible to you.'),
        ]}
      />
      <Card>
        <h2 className="text-sm font-semibold text-ink">Post an idea for your group</h2>
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
        <h2 className="mb-2 text-sm font-semibold text-ink">Ideas you can see</h2>
        {isLoading && <SkeletonText />}
        {isError && (
          <Notice tone="critical">
            {getApiErrorMessage(error, 'Could not load ideas')}
          </Notice>
        )}
        {ideas && ideas.length === 0 && (
          <EmptyState
            title="No ideas to see yet"
            hint="Supervisors and your coordinator post ideas during the idea announcement phase. Your group can post its own too."
          />
        )}
        {ideas && ideas.length > 0 && (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} cpiId={cpiId} idea={idea} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
