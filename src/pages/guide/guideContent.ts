import type { Role } from '@/types/auth';

export interface GuideStep {
  title: string;
  body: string;
  /**
   * File under `public/guide/`. Left out until a screenshot has actually been
   * captured — a broken image is worse than no image, so a step without one
   * simply renders as text.
   */
  screenshot?: string;
}

export interface GuideSection {
  role: Role;
  label: string;
  summary: string;
  steps: GuideStep[];
}

const signIn: GuideStep = {
  title: 'Sign in and set your own password',
  body: 'Use your university email. If the department issued your account, you are asked to choose your own password before anything else opens. Forgotten it? Use "Ask an administrator to reset it" on the sign-in page — there is no emailed reset link, a person handles it.',
};

export const guideSections: GuideSection[] = [
  {
    role: 'STUDENT',
    label: 'Student',
    summary: 'Find your course, form a group, choose a project, submit work and read your marks.',
    steps: [
      signIn,
      {
        title: 'Open your course',
        body: 'My courses lists the courses running for your batch, with current and past separated. If a course you expect is missing, your batch may be recorded differently — ask your coordinator. If you are repeating a module with a later batch, you can ask to join it from the same page.',
      },
      {
        title: 'Form or join a group',
        body: 'One person creates the group and invites the others by email; each invitee accepts from their own Group tab. If the course allows working alone, "Continue without a group" is there too. Groups lock when student registration closes.',
      },
      {
        title: 'Choose a project',
        body: 'Ideas shows what supervisors have posted, plus your own group’s. Mark the ones you are interested in, then make your selection. A supervisor confirms it — until they do, nothing is fixed.',
      },
      {
        title: 'Submit your work',
        body: 'Each stage that needs a file has its own upload on Submissions. Late uploads are accepted and flagged rather than refused, so upload even if you have missed the window.',
      },
      {
        title: 'Presentation times and marks',
        body: 'Schedule shows when and where your group presents. Marks appear stage by stage as the coordinator releases them; stages not yet released are named, so you know what is still to come.',
      },
    ],
  },
  {
    role: 'LECTURER',
    label: 'Supervisor / Evaluator',
    summary: 'Take on courses, offer projects, mark presentations and review scores.',
    steps: [
      signIn,
      {
        title: 'Join a course',
        body: 'A coordinator invites you, and the invitation appears on My courses to accept or decline. You can also browse Find courses and ask to supervise on one that is open to requests.',
      },
      {
        title: 'Offer projects',
        body: 'Post ideas on the course’s Ideas tab. You can invite a co-supervisor, who must accept before they appear alongside you. Groups then express interest, and you accept the group you want to take.',
      },
      {
        title: 'Give your availability',
        body: 'Availability is a grid: dates across, day-parts down. Click a cell to cycle free, maybe, busy. A blank cell means "not answered", which is not the same as "cannot make it" — fill the grid in so a timetable can be built around you.',
      },
      {
        title: 'Score a presentation',
        body: 'On the day, open the session from My sessions. The timer runs the presentation and never advances by itself, so press Next when the group actually finishes. Score each criterion, add the overall comment if the course requires one, and submit.',
      },
      {
        title: 'What you can and cannot see',
        body: 'By default you see only your own scores until the session is closed, so panel members are not influenced by each other. Some courses open scores to the whole panel; the screen says so when that is the case.',
      },
    ],
  },
  {
    role: 'COURSE_COORDINATOR',
    label: 'Coordinator',
    summary: 'Set the course up, run it through its phases, and release the marks.',
    steps: [
      signIn,
      {
        title: 'Create the course',
        body: 'Give it a name, a project type and — crucially — a batch. The batch decides which students ever see it, and a roster of zero students almost always means it was mistyped. The course starts as a draft, so you can set it up before anyone is watching.',
      },
      {
        title: 'Set the timeline',
        body: 'Each phase you enable opens the actions belonging to it. You do not have to use all ten; an omitted phase simply leaves its actions closed. The last day of a phase counts as open.',
      },
      {
        title: 'Choose the settings',
        body: 'Start from a preset — Supervisor-led or Coordinator-managed — which writes only the five settings it has an opinion about and leaves the rest as you set them. Presets can be re-applied at any time. Then adjust the individual rules: who confirms selections, how many ideas a group may post, the pass mark, the target group size.',
      },
      {
        title: 'Bring people in',
        body: 'Invite supervisors and evaluators, and appoint a head judge if the course uses one. Supervisors must accept. Check the roster: it lists everyone in the batch and what they are doing, led by those who have not started.',
      },
      {
        title: 'Publish, then allocate',
        body: 'Publish the course when it is ready for students. After selections, generate the allocations, override any pairing that needs it, and finalize. Finalizing locks it — reopening needs a written reason and is refused once marks exist.',
      },
      {
        title: 'Configure the evaluation',
        body: 'Define the stages and their weights, which must total 100, and each stage’s criteria. Mark each criterion as group-wide or per-student. Set the panel rules: how many of each role are required, whether the stage is open to any lecturer, whether scores stay isolated. This locks once submissions arrive, though panels and running order stay editable.',
      },
      {
        title: 'Build the timetable',
        body: 'Publish an availability grid, then generate the sessions and place them. Clashes are warnings, never blocks, so you can always overrule one. "Find a slot everyone can make" moves a group in a single click, and the printable sheet is the handout for the day.',
      },
      {
        title: 'Aggregate and release marks',
        body: 'Once every session is finalized, aggregate. Then release marks and comments — per stage or for the whole course, and either can be switched back off. The CA sheet is the exportable record, with students below the pass mark flagged for you alone.',
      },
    ],
  },
  {
    role: 'SYSTEM_ADMIN',
    label: 'System admin',
    summary: 'Get people into the system: approve lecturers, upload students, appoint coordinators.',
    steps: [
      signIn,
      {
        title: 'Approve lecturers',
        body: 'Lecturers register themselves and wait. Approve or reject each one. Until approved they cannot sign in, and the sign-in page will not say why — deliberately, so nobody can probe who has applied.',
      },
      {
        title: 'Upload students',
        body: 'A CSV with the header email, fullName, studentId, registrationNumber, batch, department, year. Batch is required and decides which courses each student sees. Each student receives a temporary password and must change it at first sign-in.',
      },
      {
        title: 'Appoint coordinators',
        body: 'Promote an approved lecturer to Course Coordinator so they can create and run courses.',
      },
    ],
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super admin',
    summary: 'Look after the accounts themselves. Deliberately holds no course powers.',
    steps: [
      signIn,
      {
        title: 'Create System Admins',
        body: 'A temporary password is shown once and never again — copy it before leaving the page. They choose their own at first sign-in.',
      },
      {
        title: 'Suspend rather than delete',
        body: 'Suspending stops someone signing in while keeping their record intact, and needs a written reason that whoever reinstates them will read. Deleting is refused once an account has taken part in anything, because removing it would take that history with it.',
      },
      {
        title: 'Handle password requests',
        body: 'Anyone locked out can ask for a reset from the sign-in page, and the requests land on Password requests. Resetting the account closes its request automatically.',
      },
      {
        title: 'Read the audit log',
        body: 'Every change anyone makes is recorded: who did it, what they touched, and the outcome.',
      },
    ],
  },
];
