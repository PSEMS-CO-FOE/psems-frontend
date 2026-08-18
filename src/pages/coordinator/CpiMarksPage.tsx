import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiMarks } from './CpiMarks';

export function CpiMarksPage() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.gradingEnabled ? 'Students receive a grade as well as a mark.' : 'Marks only — no grades are awarded.',
          p.caContributionPercent === null
            ? 'This course is the whole module.'
            : `This course is worth ${p.caContributionPercent}% of its module.`,
        ]}
      />
      <CpiMarks cpiId={cpiId} />
    </div>
  );
}
