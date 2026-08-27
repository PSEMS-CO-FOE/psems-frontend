import type { Role } from '@/types/auth';

/**
 * What each consequential button does. Plain data, like `markingExplainer.ts`,
 * so adding a button means adding a line here rather than editing a component.
 */
export interface GuideAction {
  /** Exactly as the button is labelled on screen. */
  label: string;
  /** Which screen it lives on. */
  where: string;
  /** What pressing it does. */
  does: string;
  /** What it takes to undo, or why it cannot be undone. */
  undoable: string;
  /** Who sees it. */
  roles: Role[];
}

export interface GuideActionGroup {
  title: string;
  actions: GuideAction[];
}

export const guideActionGroups: GuideActionGroup[] = [
  {
    title: 'Running a course',
    actions: [
      {
        label: 'Publish',
        where: 'Course → Setup',
        does: 'Makes the course visible to every student in its batch. Until then it is a draft only you can see.',
        undoable: 'Yes — Back to draft hides it again, though students who already joined stay joined.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Archive',
        where: 'Course → Setup',
        does: 'Marks the course finished. It moves to Past on every student’s list and stays readable.',
        undoable: 'Yes — it can be published again.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Apply preset',
        where: 'Course → Setup → Settings',
        does: 'Writes the five settings the preset has an opinion about — who confirms selections, who may post ideas, and so on — and leaves every other setting exactly as you had it.',
        undoable: 'Yes — apply the other preset, or change the individual settings. The screen names what it will change before it changes it.',
        roles: ['COURSE_COORDINATOR'],
      },
    ],
  },
  {
    title: 'Pairing groups with supervisors',
    actions: [
      {
        label: 'Generate from selections',
        where: 'Course → Allocation',
        does: 'Creates a pairing for every selection a supervisor has already accepted. Groups with no accepted selection are listed as unmatched for you to pair by hand.',
        undoable: 'Nothing to undo — it seeds from what exists and can be run again without discarding your overrides.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Finalize (lock)',
        where: 'Course → Allocation',
        does: 'Locks every pairing so it can no longer be edited. This is what lets evaluation sessions be generated from it.',
        undoable: 'Only with Reopen, which needs a written reason — and is refused outright once marks have been aggregated.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Reopen',
        where: 'Course → Allocation',
        does: 'Unlocks the pairings so a supervisor or an idea can be changed — ordinary when someone goes on leave mid-semester.',
        undoable: 'You are asked for a reason, which is recorded. Refused once marks have been aggregated.',
        roles: ['COURSE_COORDINATOR'],
      },
    ],
  },
  {
    title: 'Setting up the marking',
    actions: [
      {
        label: 'Save rubric',
        where: 'Course → Evaluation → Rubric',
        does: 'Replaces the whole marking scheme: stages, weights, criteria, panel rules and the running order. Held until stage weights total 100 and each stage’s criteria total 100.',
        undoable: 'Yes, until the first submission arrives — after that the server refuses the whole-rubric save, and changes go through Live settings instead.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Add a segment',
        where: 'Course → Evaluation → Rubric → Running order',
        does: 'Adds one timed part to the presentation clock for that stage. A stage with no segments runs a single clock for the whole session — a stage that is not a presentation at all simply needs none.',
        undoable: 'Yes — remove it, or leave the list empty.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Apply to all groups',
        where: 'Course → Evaluation → Panels',
        does: 'Seats the same panel on every group in a stage at once — the usual starting point before adjusting individual sessions.',
        undoable: 'Yes — edit any session afterwards. Anyone who has already submitted marks is kept rather than removed, and the result says so.',
        roles: ['COURSE_COORDINATOR'],
      },
    ],
  },
  {
    title: 'On the day',
    actions: [
      {
        label: 'Next',
        where: 'Session timer, and the projector window',
        does: 'Moves the clock to the next part of the running order. Nothing advances by itself: passing a target starts counting the overrun and waits for you.',
        undoable: 'Yes — Previous steps back.',
        roles: ['LECTURER'],
      },
      {
        label: 'Submit marks',
        where: 'My sessions → a session',
        does: 'Records your scores for that group. By default nobody else can see them until scoring closes.',
        undoable: 'Not by you. A reviewer can send them back to you with Request correction.',
        roles: ['LECTURER'],
      },
      {
        label: 'Close scoring',
        where: 'Head Judge review',
        does: 'Stops any further marks being entered for the session, and reveals the panel’s scores side by side.',
        undoable: 'Yes — Reopen sends it back to marking, until the stage has been aggregated.',
        roles: ['LECTURER'],
      },
      {
        label: 'Approve & finalize',
        where: 'Head Judge review',
        does: 'Accepts the panel’s scores for that session so they can be aggregated.',
        undoable: 'Yes — Reopen, with a reason, until the stage has been aggregated.',
        roles: ['LECTURER'],
      },
      {
        label: 'Request correction',
        where: 'Head Judge review',
        does: 'Sends one panelist’s scores back to them to revise, with a reason they will read. Everyone else’s stay as they are.',
        undoable: 'Nothing to undo — they resubmit.',
        roles: ['LECTURER'],
      },
    ],
  },
  {
    title: 'Marks',
    actions: [
      {
        label: 'Aggregate',
        where: 'Course → Marks',
        does: 'Works out every group’s and every student’s marks from the finalized scores. Refused until every session is finalized.',
        undoable: 'You can run it again after reopening and re-finalizing a session — but aggregating is the point after which allocations and sessions can no longer be reopened.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Release marks / Release comments',
        where: 'Course → Marks',
        does: 'Shows a stage’s marks, or its comments, to students. The two are separate switches, and can be set per stage or for the whole course.',
        undoable: 'Yes — either can be switched back off at any time.',
        roles: ['COURSE_COORDINATOR'],
      },
      {
        label: 'Download CSV',
        where: 'Course → Marks → CA sheet',
        does: 'Saves the continuous-assessment sheet: one row per student, one column per stage, the weight row and the total.',
        undoable: 'Nothing to undo — it only reads.',
        roles: ['COURSE_COORDINATOR'],
      },
    ],
  },
  {
    title: 'Moving around',
    actions: [
      {
        label: 'Coordinating / Supervising',
        where: 'Top of the sidebar, for a coordinator who also supervises',
        does: 'Switches between the two hats. Coordinating runs the course — phases, rubrics, scheduling and marks. Supervising is your own ideas, the groups you take on and the panels you sit on. Being made a coordinator never ends a supervision, so both stay yours.',
        undoable: 'Nothing to undo — switch back at any time. The app reopens in whichever one you used last.',
        roles: ['COURSE_COORDINATOR'],
      },
    ],
  },
  {
    title: 'Accounts',
    actions: [
      {
        label: 'Suspend',
        where: 'Super Admin → Accounts',
        does: 'Stops someone signing in while keeping their record and everything they did. Needs a written reason, which whoever reinstates them will read.',
        undoable: 'Yes — reinstate them.',
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Delete',
        where: 'Super Admin → Accounts',
        does: 'Removes an account entirely.',
        undoable: 'No. Refused once the account has taken part in anything, because removing it would take that history with it — suspend instead.',
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Approve / Reject',
        where: 'Admin → Lecturer approvals',
        does: 'Lets a lecturer who registered themselves sign in, or refuses them. Until approved they cannot sign in, and the sign-in page will not say why.',
        undoable: 'Yes — the decision can be changed.',
        roles: ['SYSTEM_ADMIN'],
      },
    ],
  },
];
