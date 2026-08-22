import { useParams } from 'react-router-dom';
import { useMarks, type StageBreakdown, type StudentBreakdown } from '@/features/marks/useMarks';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  Badge,
  Card,
  EmptyState,
  Notice,
  SectionHeader,
  SkeletonCard,
  StatRow,
  StatTile,
} from '@/components/ui';

function isStudentBreakdown(stage: StageBreakdown | StudentBreakdown): stage is StudentBreakdown {
  return 'individualComponentPercent' in stage;
}

/**
 * A table rather than a list: five numbers per stage read as run-on prose
 * otherwise, and a mark is the one thing on this page a student will check
 * against a printed sheet.
 */
function StageTable({ stages }: { stages: (StageBreakdown | StudentBreakdown)[] }) {
  // Only worth a column when at least one stage actually splits.
  const anyIndividual = stages.some(
    (s) => isStudentBreakdown(s) && s.individualComponentPercent !== null,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Stage</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Score</th>
            {anyIndividual && (
              <>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Group work</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Your own</th>
              </>
            )}
            <th scope="col" className="py-2 pr-4 text-right font-medium">Weight</th>
            <th scope="col" className="py-2 text-right font-medium">Contributes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {stages.map((stage) => {
            const individual = isStudentBreakdown(stage) ? stage : null;
            return (
              <tr key={stage.stageId} className="[font-variant-numeric:tabular-nums]">
                <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                  {stage.stageName}
                </th>
                <td className="py-2.5 pr-4 text-right font-semibold text-ink">
                  {stage.stageScorePercent}%
                </td>
                {anyIndividual && (
                  <>
                    <td className="py-2.5 pr-4 text-right text-ink-muted">
                      {individual?.individualComponentPercent !== null && individual
                        ? `${individual.groupComponentPercent}%`
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-ink-muted">
                      {individual?.individualComponentPercent !== null && individual
                        ? `${individual.individualComponentPercent}%`
                        : '—'}
                    </td>
                  </>
                )}
                <td className="py-2.5 pr-4 text-right text-ink-muted">{stage.weight}%</td>
                <td className="py-2.5 text-right text-ink-muted">
                  {stage.weightedContribution}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MarksPage() {
  const { cpiId = '' } = useParams();
  const { data, isLoading, isError, error } = useMarks(cpiId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Marks" />
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load marks')}</Notice>
      </div>
    );
  }
  if (!data) return null;

  // A student only ever sees their own row, so the first group and the first
  // student in it are theirs.
  const group = data.groups[0];
  const me = group?.students[0];
  const pending = data.pendingStages;
  const released = Boolean(group);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Marks"
        description="Your own mark, your group's, and anything still to be released."
        actions={
          pending.length > 0 && (
            <Badge tone="caution">
              {pending.length} {pending.length === 1 ? 'stage' : 'stages'} still to come
            </Badge>
          )
        }
      />

      {!released ? (
        <EmptyState
          title="No marks released yet"
          hint={
            pending.length > 0
              ? `Your coordinator releases each stage separately. Still to come: ${pending
                  .map((s) => s.stageName)
                  .join(', ')}.`
              : 'Your coordinator releases marks once every panel has finished scoring.'
          }
        />
      ) : (
        <>
          <StatRow>
            <StatTile
              label="Your mark"
              value={`${me?.overall ?? group.overall}%`}
              caption="Across every released stage"
            />
            <StatTile
              label="Group mark"
              value={`${group.overall}%`}
              caption="The average of the group's members"
            />
            {data.gradingEnabled && (
              <StatTile
                label="Grade"
                value={me?.grade ?? group.grade ?? '—'}
                caption={
                  me?.grade ?? group.grade
                    ? data.gradeIsForWholeModule
                      ? 'For the module'
                      : 'For this assessment'
                    : 'Not released yet'
                }
              />
            )}
            {data.caContributionPercent !== null && (
              <StatTile
                label="Counts toward"
                value={`${data.caContributionPercent}%`}
                caption="Of your module mark"
              />
            )}
          </StatRow>

          <Card
            title={me ? 'Your breakdown' : `${group.groupName} — breakdown`}
            description={
              me
                ? 'How each stage contributed to your mark.'
                : 'This course has no per-student criteria, so every member scores the same.'
            }
          >
            <StageTable stages={me ? me.stages : group.stages} />
          </Card>

          {/* Stated once, here, rather than repeated in a tile, an empty state
              and a trailing paragraph as it was before. */}
          {pending.length > 0 && (
            <Notice tone="info" size="xs">
              Not released yet: {pending.map((s) => s.stageName).join(', ')}. Your mark above covers
              only the stages that have been released.
            </Notice>
          )}

          {data.gradingEnabled && !data.gradeIsForWholeModule && (
            <Notice tone="info" size="xs">
              Your grade for the module is decided once the rest of it is marked.
            </Notice>
          )}
        </>
      )}
    </div>
  );
}
