import { useParams } from 'react-router-dom';
import { useMarks, type StudentBreakdown } from '@/features/marks/useMarks';
import { getApiErrorMessage } from '@/lib/apiError';

// A stage with per-student criteria splits into the group's half and the
// student's own, so it is clear which part of a mark was theirs.
function StageLine({ stage }: { stage: StudentBreakdown }) {
  return (
    <li className="text-xs text-gray-600">
      <span className="font-medium text-gray-700">{stage.stageName}</span>: {stage.stageScorePercent}%{' '}
      <span className="text-gray-400">(stage weight {stage.weight}%)</span>
      {stage.individualComponentPercent !== null && (
        <span className="ml-1 text-gray-500">
          — group work {stage.groupComponentPercent}, your own {stage.individualComponentPercent}
        </span>
      )}
    </li>
  );
}

export function MarksPage() {
  const { cpiId = '' } = useParams();
  const { data, isLoading, isError, error } = useMarks(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading marks…</p>;
  if (isError) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {getApiErrorMessage(error, 'Could not load marks')}
      </p>
    );
  }
  if (!data) return null;

  const nothingReleased = data.groups.length === 0;

  return (
    <div className="space-y-2">
      {nothingReleased && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Your marks haven&rsquo;t been released yet.
        </p>
      )}

      {data.groups.map((group) => (
        <div key={group.groupId} className="rounded-lg border bg-white p-4">
          <p className="text-sm font-semibold text-gray-800">
            {group.groupName} — group overall {group.overall}
            {group.grade && <span className="ml-1 text-gray-500">({group.grade})</span>}
          </p>

          {group.students.map((student) => (
            <div key={student.studentId} className="mt-2">
              <p className="text-sm text-gray-700">
                Your mark: <span className="font-semibold">{student.overall}</span>
                {student.grade && <span className="ml-1 text-gray-500">({student.grade})</span>}
                {/* What these marks add to the module, rather than a grade that
                    would be wrong when this is only part of it. */}
                {student.contributionToModule !== null && (
                  <span className="ml-1 text-gray-500">
                    — contributes {student.contributionToModule} of {data.caContributionPercent} to the module
                  </span>
                )}
              </p>
              <ul className="mt-1 space-y-1">
                {student.stages.map((stage) => (
                  <StageLine key={stage.stageId} stage={stage} />
                ))}
              </ul>
            </div>
          ))}

          {/* Falls back to the group breakdown on a course with no per-student
              criteria, where there is nothing individual to show. */}
          {group.students.length === 0 && (
            <ul className="mt-2 space-y-1">
              {group.stages.map((stage) => (
                <li key={stage.stageId} className="text-xs text-gray-600">
                  {stage.stageName}: {stage.stageScorePercent}% (stage weight {stage.weight}%)
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {data.pendingStages.length > 0 && (
        <p className="rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Still to come: {data.pendingStages.map((s) => s.stageName).join(', ')}.
        </p>
      )}

      {data.caContributionPercent !== null && !nothingReleased && (
        <p className="text-xs text-gray-500">
          This continuous assessment contributes {data.caContributionPercent}% of your final mark for the module.
          {!data.gradeIsForWholeModule && ' Your grade for the module is decided once the rest of it is marked.'}
        </p>
      )}

      {data.gradingEnabled && data.gradeIsForWholeModule && !data.gradesReleased && !nothingReleased && (
        <p className="text-xs text-gray-500">Your grade has not been released yet.</p>
      )}
    </div>
  );
}
