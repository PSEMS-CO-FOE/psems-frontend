import { useState } from 'react';
import {
  useIdeas,
  usePostIdea,
  useDecideIdea,
  useRequestIdeaRevision,
  type Idea,
} from '@/features/ideas/useIdeas';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, SkeletonText, Notice } from '@/components/ui';
import { personName } from '@/lib/name';
import { ideaApprovalLabel, ideaAuthorLabel } from '@/lib/labels';
import { downloadIdeasSheet } from '@/features/ideas/ideasPdf';
import { DownloadPdfButton } from '@/features/pdf/DownloadPdfButton';
import { useCpiSummary } from '@/features/courses/useCourses';

function StudentIdeaRow({ cpiId, idea }: { cpiId: string; idea: Idea }) {
  const decide = useDecideIdea(cpiId);
  const requestRevision = useRequestIdeaRevision(cpiId);
  const [note, setNote] = useState('');
  const pending = idea.approvalStatus === 'PENDING' || idea.approvalStatus === 'REVISION_REQUESTED';

  return (
    <li className="text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-ink">{idea.title}</p>
          <p className="text-ink-subtle">
            {ideaAuthorLabel(idea.authorType)}
            {` · ${personName(idea.author)}`}
            {idea.group && ` · ${idea.group.name}`}
            {idea.approvalStatus &&
              ` · ${ideaApprovalLabel(idea.approvalStatus)}`}
          </p>
          {/* The description is what the decision is actually made on. */}
          <p className="mt-1 whitespace-pre-wrap text-ink-muted">{idea.description}</p>
          {idea.revisionNote && (
            <p className="mt-1 text-caution-700">Revision asked for: {idea.revisionNote}</p>
          )}
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
        <Notice tone="critical" size="xs" className="mt-1">{getApiErrorMessage(decide.error || requestRevision.error)}</Notice>
      )}
    </li>
  );
}

export function CpiIdeasModeration({ cpiId }: { cpiId: string }) {
  const { data: ideas, isLoading } = useIdeas(cpiId);
  const { data: cpi } = useCpiSummary(cpiId);
  const postIdea = usePostIdea(cpiId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Card
      title="Ideas"
      actions={
        <DownloadPdfButton
          disabled={!ideas?.length || !cpi}
          onDownload={() =>
            downloadIdeasSheet(ideas ?? [], {
              courseName: cpi?.name ?? 'Course',
              academicYear: cpi?.academicYear ?? '',
            })
          }
        />
      }
    >

      <div className="mt-3 border-b pb-3">
        <p className="mb-1 text-xs font-medium text-ink-muted">Post a public idea (Coordinator-Managed)</p>
        {postIdea.isError && (
          <Notice tone="critical" size="xs" className="mb-1">{getApiErrorMessage(postIdea.error)}</Notice>
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

      {isLoading && <SkeletonText className="mt-3" />}
      <ul className="mt-3 space-y-3">
        {ideas?.map((idea) =>
          idea.authorType === 'STUDENT' ? (
            <StudentIdeaRow key={idea.id} cpiId={cpiId} idea={idea} />
          ) : (
            <li key={idea.id} className="text-xs">
              <p className="font-medium text-ink">{idea.title}</p>
              <p className="text-ink-subtle">
                {ideaAuthorLabel(idea.authorType)}
                {` · ${personName(idea.author)}`}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-ink-muted">{idea.description}</p>
            </li>
          ),
        )}
      </ul>
    </Card>
  );
}
