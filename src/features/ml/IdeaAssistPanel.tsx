import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMlStatus, useSimilarityPreview, useSupervisorSuggestions } from './useMl';

// Draft-time AI assistance beside the idea form. Deliberately opt-in (the
// student presses the button) rather than firing on every keystroke: the
// service is slow enough that background calls would feel broken, and an
// unrequested suggestion is easy to mistake for a verdict.
export function IdeaAssistPanel({ title, description }: { title: string; description: string }) {
  const status = useMlStatus();
  const supervisors = useSupervisorSuggestions();
  const similarity = useSimilarityPreview();
  const [ran, setRan] = useState(false);

  // Hidden entirely when ML is off or unreachable — no broken affordance.
  if (!status.data?.enabled || !status.data?.reachable) return null;

  const ready = title.trim().length > 0 && description.trim().length > 20;
  const busy = supervisors.isPending || similarity.isPending;

  function analyse() {
    setRan(true);
    supervisors.mutate({ title, description });
    similarity.mutate({ title, description });
  }

  const similar = similarity.data?.similar_projects ?? [];

  return (
    <Card
      title="AI assistance"
      description="Suggested supervisors and similar past projects for this draft."
      actions={
        <Button size="sm" variant="secondary" onClick={analyse} disabled={!ready || busy}>
          {busy ? 'Analysing…' : ran ? 'Re-analyse' : 'Analyse draft'}
        </Button>
      }
    >
      {!ready && (
        <p className="text-sm text-ink-muted">
          Add a title and a short description to get suggestions.
        </p>
      )}

      {ran && similarity.data?.flagged && (
        <div className="mb-4 rounded-md bg-caution-50 p-3 text-sm text-caution-700 ring-1 ring-caution-500/30">
          This looks very close to an existing project. Check the matches below — you may want
          to differentiate your idea.
        </div>
      )}

      {supervisors.data && supervisors.data.length > 0 && (
        <section className="mb-4">
          <h4 className="mb-2 text-sm font-medium text-ink">Suggested supervisors</h4>
          <ul className="space-y-2">
            {supervisors.data.map((s) => (
              <li key={s.lecturer_id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="truncate text-xs text-ink-muted">{s.research_interests}</p>
                </div>
                <Badge tone="brand">{s.match_percent}%</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-subtle">
            Suggestions only — supervisor allocation remains the coordinator's decision.
          </p>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h4 className="mb-2 text-sm font-medium text-ink">Similar past projects</h4>
          <ul className="space-y-2">
            {similar.map((p) => (
              <li key={p.idea_id} className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-ink">{p.title ?? p.idea_id}</p>
                <Badge tone={p.tier === 'high' ? 'critical' : p.tier === 'moderate' ? 'caution' : 'neutral'}>
                  {Math.round(p.similarity * 100)}%
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ran && !busy && !supervisors.data?.length && !similar.length && (
        <p className="text-sm text-ink-muted">No suggestions available for this draft.</p>
      )}
    </Card>
  );
}
