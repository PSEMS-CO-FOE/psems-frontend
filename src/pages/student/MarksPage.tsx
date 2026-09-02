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
    <div className="table-scroll">
      <table className="data-table min-w-[34rem]">
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col" className="text-right">Score</th>
            {anyIndividual && (
              <>
                <th scope="col" className="text-right">Group work</th>
                <th scope="col" className="text-right">Your own</th>
              </>
            )}
            <th scope="col" className="text-right">Weight</th>
            <th scope="col" className="text-right">Contributes</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => {
            const individual = isStudentBreakdown(stage) ? stage : null;
            return (
              <tr key={stage.stageId}>
                <th scope="row">
                  {stage.stageName}
                </th>
                <td className="text-right font-semibold text-ink">
                  {stage.stageScorePercent}%
                </td>
                {anyIndividual && (
                  <>
                    <td className="text-right text-ink-muted">
                      {individual?.individualComponentPercent !== null && individual
                        ? `${individual.groupComponentPercent}%`
                        : '—'}
                    </td>
                    <td className="text-right text-ink-muted">
                      {individual?.individualComponentPercent !== null && individual
                        ? `${individual.individualComponentPercent}%`
                        : '—'}
                    </td>
                  </>
                )}
                <td className="text-right text-ink-muted">{stage.weight}%</td>
                <td className="text-right text-ink-muted">
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
            {/* A course may release the grade and hold the figures back, which is
                the usual shape of a final year project. */}
            {data.marksReleased && (
              <>
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
              </>
            )}
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

          {!data.marksReleased && (
            <Notice tone="info">
              This course releases the grade rather than the marks behind it. Your grade is above;
              the per-stage figures are not published.
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
