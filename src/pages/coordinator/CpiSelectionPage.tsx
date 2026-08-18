import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiSelections } from './CpiSelections';
import { CpiSupervisorRequests } from './CpiSupervisorRequests';

const CONFIRMER = {
  SUPERVISOR: 'the chosen supervisor',
  COORDINATOR: 'you',
  EITHER: 'either you or the chosen supervisor',
};

export function CpiSelectionPage() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.interestEnabled
            ? 'Groups and lecturers express interest before anything is confirmed.'
            : 'Interest is turned off — selections are confirmed directly.',
          `A selection is confirmed by ${CONFIRMER[p.selectionConfirmedBy]}.`,
          p.interestEnabled &&
            (p.allowInterestWithdrawal
              ? 'Interest may be withdrawn while the phase is open.'
              : 'Interest cannot be withdrawn once expressed.'),
          p.maxInterestsPerGroup !== null && `A group may express at most ${p.maxInterestsPerGroup} interest(s).`,
          p.allowSupervisorSelfRequest && 'Lecturers not on this course may ask you to let them supervise.',
        ]}
      />
      <CpiSelections cpiId={cpiId} />
      <CpiSupervisorRequests cpiId={cpiId} />
    </div>
  );
}
