/**
 * How a mark is actually arrived at. Written once and shown to every role,
 * because a student checking a figure, a panelist entering one and a
 * coordinator releasing them all need the same facts — and a student who
 * cannot see how the number was reached has no way to query it.
 *
 * Kept in step with `marks.service.ts`; if the aggregation changes, this
 * changes with it.
 */
export interface MarkingPoint {
  heading: string;
  body: string;
}

export const markingIntro =
  'Nothing about a mark is a black box. Every figure comes from the panel’s scores by the same route, and each step is set by the coordinator when the course is configured.';

export const markingPoints: MarkingPoint[] = [
  {
    heading: 'Each panelist scores each criterion',
    body: 'A stage has criteria, and each criterion has a maximum. Everyone seated on the panel scores every criterion. Until scoring closes, panelists normally cannot see each other’s scores — that isolation is the default, and the screen says so when a course has turned it off.',
  },
  {
    heading: 'The panel’s scores combine as a weighted average',
    body: 'Not a sum. Weights say how much someone’s opinion counts, so three markers weighted 50/25/25 who all give 80 produce 80, not 40. With no weights set — the usual case — it is a plain average. A weight set on one person’s seat beats the weight set for their role, which is how a coordinator can count one particular marker differently without changing the rule for everyone.',
  },
  {
    heading: 'A criterion becomes a share of the stage',
    body: 'The combined score is turned into a percentage of that criterion’s maximum, then multiplied by the criterion’s weight. The criteria in a stage add up to 100, so together they account for the whole stage.',
  },
  {
    heading: 'Group criteria and individual criteria differ',
    body: 'A criterion marked for the whole group gives every member the same share. A criterion marked per student gives each member their own. A student’s stage mark shows the split between the two, so you can see which part was the group’s work and which was yours.',
  },
  {
    heading: 'A stage becomes a share of the course',
    body: 'Each stage carries a weight, and the stages add up to 100. A proposal worth 20 and a final demonstration worth 50 contribute in that proportion. The course as a whole may itself be only part of a module — the marks page states what share, when the coordinator has set it.',
  },
  {
    heading: 'A criterion nobody scored counts as zero',
    body: 'It is not quietly redistributed across the criteria that were scored, because that would award a mark for work nobody assessed. It shows as the shortfall it is. Reviewers see how many panelists have finished before they close scoring, so this only arises when scoring is closed deliberately short.',
  },
  {
    heading: 'Walk-in and guest markers count once, together',
    body: 'On an open event, everyone who marks without a formal seat is averaged into a single contribution, weighted by a share the coordinator sets for that stage and capped by a limit. That is deliberate: a crowd cannot outvote the formal panel simply by being numerous. Every change to that share is recorded with a written reason.',
  },
  {
    heading: 'The group’s figure is the average of its members’',
    body: 'Where every criterion is group-wide, each member scores the same, so the group figure is identical to each member’s. The two only diverge once a stage has per-student criteria.',
  },
  {
    heading: 'Grades, if the course uses them',
    body: 'A grade is only applied when the coordinator has enabled grading and defined the bands. The band is the first one the mark reaches, counting from the top. A course without bands has marks and no grades, which is normal for continuous assessment.',
  },
  {
    heading: 'Releasing is deliberate, per stage, and reversible',
    body: 'Marks and comments are separate switches. A coordinator can release one stage and not another, release comments without marks, and switch either back off. Until a stage is released, students see it named as still to come rather than left wondering whether it exists.',
  },
];
