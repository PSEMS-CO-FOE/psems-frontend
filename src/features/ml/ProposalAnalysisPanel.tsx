import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMlStatus, useProposalAnalysis } from './useMl';

const REQUIRED = ['Abstract', 'Problem Statement', 'Objectives', 'Methodology', 'References'];

// Structured view of an uploaded proposal: what the document contains, what it
// is about, and what it is missing. Extraction only — no grade or score, which
// would imply a judgement the system is not entitled to make.
export function ProposalAnalysisPanel({
  cpiId,
  submissionId,
  fileName,
}: {
  cpiId: string;
  submissionId: string;
  fileName?: string;
}) {
  const status = useMlStatus();
  const analysis = useProposalAnalysis();

  if (!status.data?.enabled || !status.data?.reachable) return null;

  const result = analysis.data;
  const data = result?.available ? result.analysis : null;

  return (
    <Card
      title="Proposal analysis"
      description={fileName ? `Extracted from ${fileName}` : 'Extracted from the uploaded document.'}
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => analysis.mutate({ cpiId, submissionId })}
          disabled={analysis.isPending}
        >
          {analysis.isPending ? 'Analysing…' : data ? 'Re-analyse' : 'Analyse proposal'}
        </Button>
      }
    >
      {result && !result.available && (
        <p className="text-sm text-ink-muted">Analysis unavailable: {result.reason}.</p>
      )}

      {data && (
        <div className="space-y-4">
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Title</h4>
            <p className="text-sm text-ink">{data.title}</p>
          </section>

          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Research area</h4>
            <p className="text-sm text-ink">
              {data.research_area.primary_area}
              {data.research_area.sub_area && (
                <span className="text-ink-muted"> · {data.research_area.sub_area}</span>
              )}
            </p>
          </section>

          <section>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Sections</h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
              {REQUIRED.map((s) => {
                const present = data.sections_found.includes(s);
                return (
                  <li key={s} className="flex items-center gap-2 text-sm">
                    <span className={present ? 'text-positive-600' : 'text-critical-600'}>
                      {present ? '✓' : '✗'}
                    </span>
                    <span className={present ? 'text-ink' : 'text-critical-700'}>{s}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {data.technologies.length > 0 && (
            <section>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Technologies</h4>
              <div className="flex flex-wrap gap-1">
                {data.technologies.map((t) => (
                  <Badge key={t.name} tone="info">{t.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {data.keywords.length > 0 && (
            <section>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {data.keywords.slice(0, 6).map((k) => (
                  <Badge key={k.keyword} tone="neutral">{k.keyword}</Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">Complexity</h4>
            <div className="flex items-center gap-2">
              <Badge tone={data.complexity.complexity === 'High' ? 'caution' : 'neutral'}>
                {data.complexity.complexity}
              </Badge>
              <span className="text-xs text-ink-muted">{data.complexity.reasons.join(', ')}</span>
            </div>
          </section>

          <p className="text-xs text-ink-subtle">
            Extracted automatically to assist review — it does not assess quality or assign a mark.
          </p>
        </div>
      )}
    </Card>
  );
}
