import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIdeas, usePostIdea, useUpdateIdea, type Idea } from '@/features/ideas/useIdeas';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

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
    <li className="rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{idea.title}</p>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{idea.authorType}</span>
      </div>
      <p className="mt-1 text-xs text-gray-600">{idea.description}</p>
      <p className="mt-2 text-xs text-gray-400">
        by {personName(idea.author)}
        {idea.group && ` · ${idea.group.name}`}
        {idea.approvalStatus && ` · ${idea.approvalStatus.replace('_', ' ')}`}
      </p>

      {idea.approvalStatus === 'REVISION_REQUESTED' && idea.revisionNote && (
        <p className="mt-2 rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          Revision requested: {idea.revisionNote}
        </p>
      )}

      {editable && !editing && idea.approvalStatus !== 'APPROVED' && idea.approvalStatus !== 'REJECTED' && (
        <button
          onClick={() => setEditing(true)}
          className="mt-2 rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          Edit &amp; resubmit
        </button>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!title || !description || update.isPending}
              className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {update.isPending ? '…' : 'Resubmit'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          {update.isError && (
            <p className="text-xs text-red-600">{getApiErrorMessage(update.error)}</p>
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
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Post an idea for your group</h2>
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
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Ideas you can see</h2>
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {isError && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {getApiErrorMessage(error, 'Could not load ideas')}
          </p>
        )}
        {ideas && ideas.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No ideas visible yet.
          </p>
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
