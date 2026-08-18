import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiEvaluationConfig } from './CpiEvaluationConfig';
import { StageLiveSettings } from './StageLiveSettings';
import { CpiSessionPanels } from './CpiSessionPanels';

export function CpiEvaluationPage() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.headJudgeEnabled
            ? 'A Head Judge reviews each evaluation before it reaches you.'
            : 'Marks come straight to you — there is no Head Judge on this course.',
          p.requireOverallComment
            ? 'Every evaluator must leave an overall comment, not only per-criterion ones.'
            : 'An overall comment is optional.',
        ]}
      />
      <CpiEvaluationConfig cpiId={cpiId} />
      <StageLiveSettings cpiId={cpiId} />
      <CpiSessionPanels cpiId={cpiId} />
    </div>
  );
}
