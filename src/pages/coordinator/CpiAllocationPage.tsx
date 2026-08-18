import { useParams } from 'react-router-dom';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiAllocation } from './CpiAllocation';

export function CpiAllocationPage() {
  const { cpiId = '' } = useParams();
  const { data: cpi } = useCpiDetail(cpiId);
  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.allowIndividualParticipation
            ? 'Students may take part individually as well as in groups.'
            : 'Every student must be in a group.',
          p.allowIndividualParticipation &&
            p.autoCreateSoloGroup &&
            'A solo group is created automatically for a student taking part alone.',
        ]}
      />
      <CpiAllocation cpiId={cpiId} mode={cpi?.mode ?? null} />
    </div>
  );
}
