import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { CpiIdeasModeration } from './CpiIdeasModeration';

export function CpiIdeasPage() {
  const { cpiId = '' } = useParams();
  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.allowStudentIdeas
            ? p.studentIdeasLeaderOnly
              ? 'Only a group leader may post their group’s idea.'
              : 'Any group member may post an idea.'
            : 'Students may not post ideas.',
          p.requireStudentIdeaApproval
            ? 'Student ideas wait for your approval before anyone can pick them.'
            : 'Student ideas go live without approval.',
          p.allowSupervisorIdeas && 'Supervisors may post ideas.',
          p.allowCoordinatorIdeas && 'You may post ideas.',
          p.allowLecturerIdeas && 'Any lecturer may post ideas, including ones not on this course.',
          p.maxIdeasPerGroup !== null && `A group may post at most ${p.maxIdeasPerGroup} idea(s).`,
        ]}
      />
      <CpiIdeasModeration cpiId={cpiId} />
    </div>
  );
}
