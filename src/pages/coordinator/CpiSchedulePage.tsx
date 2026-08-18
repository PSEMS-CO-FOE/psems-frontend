import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiScheduling } from './CpiScheduling';

const REQUIRED_FROM = {
  EVALUATORS_ONLY: 'Evaluators submit availability; supervisors do not.',
  EVALUATORS_AND_SUPERVISORS: 'Evaluators and supervisors both submit availability.',
  NONE: 'Nobody submits availability — you schedule directly.',
};

export function CpiSchedulePage() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <PolicyNote cpiId={cpiId} lines={(p) => [REQUIRED_FROM[p.availabilityRequiredFrom]]} />
      <CpiScheduling cpiId={cpiId} />
    </div>
  );
}
