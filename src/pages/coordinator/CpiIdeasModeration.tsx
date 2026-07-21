import { useState } from 'react';
import { useIdeas, usePostIdea, useDecideIdea } from '@/features/ideas/useIdeas';
import { getApiErrorMessage } from '@/lib/apiError';

export function CpiIdeasModeration({ cpiId }: { cpiId: string }) {
  const { data: ideas, isLoading } = useIdeas(cpiId);
  const postIdea = usePostIdea(cpiId);
  const decide = useDecideIdea(cpiId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Ideas</h3>

      <div className="mt-3 border-b pb-3">
        <p className="mb-1 text-xs font-medium text-gray-600">Post a public idea (Coordinator-Managed)</p>
        {postIdea.isError && (
          <p className="mb-1 text-xs text-red-600">{getApiErrorMessage(postIdea.error)}</p>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Idea title"
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
        />
        <button
          onClick={() =>
            postIdea.mutate({ title, description }, { onSuccess: () => { setTitle(''); setDescription(''); } })
          }
          disabled={!title || !description || postIdea.isPending}
          className="mt-1 rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {postIdea.isPending ? '…' : 'Post idea'}
        </button>
      </div>

      {isLoading && <p className="mt-3 text-xs text-gray-500">Loading ideas…</p>}
      <ul className="mt-3 space-y-2">
        {ideas?.map((idea) => (
          <li key={idea.id} className="flex items-start justify-between gap-2 text-xs">
            <div>
              <p className="font-medium text-gray-800">{idea.title}</p>
              <p className="text-gray-400">
                {idea.authorType}
                {idea.group && ` · ${idea.group.name}`}
                {idea.approvalStatus && ` · ${idea.approvalStatus}`}
              </p>
            </div>
            {idea.authorType === 'STUDENT' && idea.approvalStatus === 'PENDING' && (
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => decide.mutate({ ideaId: idea.id, decision: 'approve' })}
                  disabled={decide.isPending}
                  className="rounded bg-green-600 px-2 py-0.5 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide.mutate({ ideaId: idea.id, decision: 'reject' })}
                  disabled={decide.isPending}
                  className="rounded bg-red-600 px-2 py-0.5 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {decide.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(decide.error)}</p>
      )}
    </div>
  );
}
