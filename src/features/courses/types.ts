export type CpiProjectType = 'FYP' | 'DATA_MANAGEMENT' | 'HPC' | 'INNOVATION_CHALLENGE';
export type CpiParticipationMode = 'GROUP' | 'INDIVIDUAL';
export type CpiMode = 'SUPERVISOR_LED' | 'COORDINATOR_MANAGED' | null;

export type CpiPhaseName =
  | 'STUDENT_REGISTRATION'
  | 'SUPERVISOR_ADDITION'
  | 'IDEA_ANNOUNCEMENT'
  | 'PROJECT_SELECTION'
  | 'PROJECT_REGISTRATION'
  | 'EVALUATION_CONFIG'
  | 'PROPOSAL_SUBMISSION'
  | 'AVAILABILITY_SUBMISSION'
  | 'EVALUATION_EXECUTION'
  | 'FINAL_SUBMISSION';

// Canonical phase order — the exact order the timeline PUT expects.
export const PHASE_ORDER: CpiPhaseName[] = [
  'STUDENT_REGISTRATION',
  'SUPERVISOR_ADDITION',
  'IDEA_ANNOUNCEMENT',
  'PROJECT_SELECTION',
  'PROJECT_REGISTRATION',
  'EVALUATION_CONFIG',
  'PROPOSAL_SUBMISSION',
  'AVAILABILITY_SUBMISSION',
  'EVALUATION_EXECUTION',
  'FINAL_SUBMISSION',
];

export interface Cpi {
  id: string;
  name: string;
  projectType: CpiProjectType;
  participationMode: CpiParticipationMode;
  department: string;
  academicYear: string;
  mode: CpiMode;
  createdById: string;
  createdAt: string;
}

export interface TimelinePhase {
  id: string;
  phase: CpiPhaseName;
  startDate: string;
  endDate: string;
}

type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

interface LecturerRef {
  lecturer: { user: { email: string; fullName: string | null } };
}

export interface CpiDetail extends Cpi {
  timeline: TimelinePhase[];
  supervisors: (LecturerRef & { id: string; invitationStatus: InvitationStatus })[];
  evaluators: (LecturerRef & { id: string; isHeadJudge: boolean })[];
}
