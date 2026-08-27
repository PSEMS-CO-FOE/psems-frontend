import type { BadgeTone } from '@/components/ui';

/**
 * Three kinds of profile. A student shows skills and work; an academic shows
 * research and supervision; an administrator shows contact details only.
 */
export type ProfileKind = 'student' | 'academic' | 'administrator';

export interface ProfileShape {
  kind: ProfileKind;
  /** What to call this person on their own profile and in the directory. */
  roleLabel: string;
  badgeTone: BadgeTone;
  /** Research areas / skills. An administrator has neither. */
  interestsLabel: string | null;
  /** Publications / achievements. An administrator has neither. */
  outputsLabel: string | null;
  outputsHint: string;
  /** Projects supervised, or projects done. Never both, and never for an
   *  administrator, who takes part in no course. */
  projectsLabel: string | null;
  /** Which side of the derived project lists this person appears on. */
  projectsSource: 'own' | 'supervised' | null;
  /** Job title. A student has none, so the field is not shown to them. */
  designationLabel: string | null;
  /** The line under the editor's heading, explaining who reads this. */
  editorNote: string;
  /** Placeholder for the headline field, so the example fits the person. */
  headlinePlaceholder: string;
  interestsPlaceholder: string;
}

const student: ProfileShape = {
  kind: 'student',
  roleLabel: 'Student',
  badgeTone: 'info',
  interestsLabel: 'Skills and interests',
  outputsLabel: 'Work and achievements',
  outputsHint: 'Competition entries, side projects, anything you have built or won.',
  projectsLabel: 'Projects done',
  projectsSource: 'own',
  designationLabel: null,
  editorNote:
    'Anyone signed in can read this. Listing what you are good at and interested in is how supervisors and teammates find you.',
  headlinePlaceholder: 'Final year, interested in embedded systems',
  interestsPlaceholder: 'React, Machine learning, Robotics',
};

const academic = (roleLabel: string): ProfileShape => ({
  kind: 'academic',
  roleLabel,
  badgeTone: 'brand',
  interestsLabel: 'Research',
  outputsLabel: 'Publications and projects',
  outputsHint: 'Papers, funded projects and grants.',
  projectsLabel: 'Projects supervised',
  projectsSource: 'supervised',
  designationLabel: 'Designation',
  editorNote:
    'Anyone signed in can read this. Students use it when choosing a supervisor, so research areas are worth filling in — they are what the directory filters on.',
  headlinePlaceholder: 'Senior Lecturer, Networks',
  interestsPlaceholder: 'Wireless, IoT, Embedded systems',
});

const administrator = (roleLabel: string): ProfileShape => ({
  kind: 'administrator',
  roleLabel,
  badgeTone: 'neutral',
  interestsLabel: null,
  outputsLabel: null,
  outputsHint: '',
  projectsLabel: null,
  projectsSource: null,
  designationLabel: 'Office or role',
  editorNote:
    'This is how people reach you when something needs an administrator. Keep the office and contact address current — they are the only parts anyone reads.',
  headlinePlaceholder: 'Systems administrator, Faculty office',
  interestsPlaceholder: '',
});

// `role` arrives from the API as a plain string, so an unrecognised value has
// to land somewhere. Academic is the safe default: it shows everything, where
// the administrator shape would silently hide a real person's work.
const shapes: Record<string, ProfileShape> = {
  STUDENT: student,
  LECTURER: academic('Lecturer'),
  COURSE_COORDINATOR: academic('Course coordinator'),
  SYSTEM_ADMIN: administrator('System administrator'),
  SUPER_ADMIN: administrator('Super administrator'),
};

export function profileShape(role: string | undefined): ProfileShape {
  return (role && shapes[role]) || academic('Lecturer');
}
