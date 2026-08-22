import { useState } from 'react';
import {
  useIdeas,
  usePostIdea,
  useDecideIdea,
  useRequestIdeaRevision,
  type Idea,
} from '@/features/ideas/useIdeas';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card } from '@/components/ui';

function StudentIdeaRow({ cpiId, idea }: { cpiId: string; idea: Idea }) {
  const decide = useDecideIdea(cpiId);
  const requestRevision = useRequestIdeaRevision(cpiId);
  const [note, setNote] = useState('');
  const pending = idea.approvalStatus === 'PENDING' || idea.approvalStatus === 'REVISION_REQUESTED';

  return (
    <li className="text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{idea.title}</p>
          <p className="text-ink-subtle">
            {idea.authorType}
            {idea.group && ` · ${idea.group.name}`}
            {idea.approvalStatus && ` · ${idea.approvalStatus.replace('_', ' ')}`}
          </p>
        </div>
        {pending && (
          <div className="flex shrink-0 gap-1">
            <Button variant="success" size="sm"
              onClick={() => decide.mutate({ ideaId: idea.id, decision: 'approve' })}
              disabled={decide.isPending}>
              Approve
            </Button>
            <Button variant="danger" size="sm"
              onClick={() => decide.mutate({ ideaId: idea.id, decision: 'reject' })}
              disabled={decide.isPending}>
              Reject
            </Button>
          </div>
        )}
      </div>
      {pending && (
        <div className="mt-1 flex gap-1">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="revision note for the group"
            className="flex-1 rounded-control border border-line-strong px-2 py-0.5"
          />
          <Button variant="caution" size="sm"
            onClick={() => requestRevision.mutate({ ideaId: idea.id, note }, { onSuccess: () => setNote('') })}
            disabled={!note || requestRevision.isPending}>
            Request revision
          </Button>
        </div>
      )}
      {(decide.isError || requestRevision.isError) && (
        <p className="mt-1 text-critical-700">{getApiErrorMessage(decide.error || requestRevision.error)}</p>
      )}
    </li>
  );
}

export function CpiIdeasModeration({ cpiId }: { cpiId: string }) {
  const { data: ideas, isLoading } = useIdeas(cpiId);
  const postIdea = usePostIdea(cpiId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Card title="Ideas">

      <div className="mt-3 border-b pb-3">
        <p className="mb-1 text-xs font-medium text-ink-muted">Post a public idea (Coordinator-Managed)</p>
        {postIdea.isError && (
          <p className="mb-1 text-xs text-critical-700">{getApiErrorMessage(postIdea.error)}</p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Idea title"
          className="w-full rounded-control border border-line-strong px-2 py-1 text-xs"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="mt-1 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
        />
        <Button variant="primary" size="sm" className="mt-1"
          onClick={() =>
            postIdea.mutate({ title, description }, { onSuccess: () => { setTitle(''); setDescription(''); } })
          }
          disabled={!title || !description || postIdea.isPending}>
          {postIdea.isPending ? '…' : 'Post idea'}
        </Button>
      </div>

      {isLoading && <p className="mt-3 text-xs text-ink-muted">Loading ideas…</p>}
      <ul className="mt-3 space-y-3">
        {ideas?.map((idea) =>
          idea.authorType === 'STUDENT' ? (
            <StudentIdeaRow key={idea.id} cpiId={cpiId} idea={idea} />
          ) : (
            <li key={idea.id} className="text-xs">
              <p className="font-medium text-ink">{idea.title}</p>
              <p className="text-ink-subtle">{idea.authorType}</p>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}
