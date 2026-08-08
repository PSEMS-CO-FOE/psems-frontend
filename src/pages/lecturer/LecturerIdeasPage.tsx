import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIdeas, usePostIdea } from '@/features/ideas/useIdeas';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiError';
import { personName } from '@/lib/name';

// Supervisor idea announcement (Supervisor-Led mode): an accepted supervisor
// posts project ideas for groups to express interest in, and sees the CPI's
// ideas. The backend authorizes posting by supervisor capacity.
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
