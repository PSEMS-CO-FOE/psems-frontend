import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PolicyNote } from '@/components/PolicyNote';
import { useEvaluationConfig } from '@/features/evaluations/useEvaluationConfig';
import { useSessions } from '@/features/scheduling/useScheduling';
import { InfoTip, SectionHeader, Segmented } from '@/components/ui';
import { CpiEvaluationConfig } from './CpiEvaluationConfig';
import { StageLiveSettings } from './StageLiveSettings';
import { CpiSessionPanels } from './CpiSessionPanels';

type View = 'rubric' | 'live' | 'panels';

const VIEWS: { value: View; label: string; heading: string; hint: string; tip: string }[] = [
  {
    value: 'rubric',
    label: 'Rubric',
    heading: 'What each stage is worth, and how it is scored',
    hint: 'Stages, their weights, the panel each expects, the running order and the criteria. This locks once submissions arrive.',
    tip: 'The whole marking scheme for the course. Because it is replace-all, the server refuses it once any submission exists — anything that has to stay changeable after that lives under Live settings.',
  },
  {
    value: 'live',
    label: 'Live settings',
    heading: 'What stays changeable once the course is running',
    hint: 'Stage weights, panel composition, score visibility, the pooled mark share and the presentation clock — each saves on its own.',
    tip: 'These use targeted endpoints rather than the replace-all rubric, so they keep working on evaluation day. This is where you restaff a panel or fix a weight after marking has started.',
  },
  {
    value: 'panels',
    label: 'Panels',
    heading: 'Who sits on each session',
    hint: 'Seat evaluators per session, apply a panel to every group in a stage at once, and invite guest markers.',
    tip: 'Panels are per session, so swapping one group’s evaluator never touches another’s. Anyone who has already submitted marks is kept rather than removed.',
  },
];

/**
 * Three editors, picked one at a time. Stacked they were one very long scroll,
 * and they answer different questions at different points in the course.
 */
export function CpiEvaluationPage() {
  const { cpiId = '' } = useParams();
  const [view, setView] = useState<View>('rubric');

  // Counts on the switcher, so it says what is behind each option.
  const { data: stages } = useEvaluationConfig(cpiId);
  const { data: sessions } = useSessions(cpiId);

  const counts: Record<View, number | null> = {
    rubric: stages?.length ?? null,
    live: stages?.length ?? null,
    panels: sessions?.length ?? null,
  };

  const active = VIEWS.find((v) => v.value === view) ?? VIEWS[0];

  return (
    <div className="space-y-5">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.headJudgeEnabled
            ? 'A Head Judge reviews each evaluation before it reaches you.'
            : 'Marks come straight to you — there is no Head Judge on this course.',
          p.requireOverallComment
            ? 'Every evaluator must leave an overall comment, not only per-criterion ones.'
            : 'An overall comment is optional.',
        ]}
      />

      <Segmented
        label="Evaluation area"
        value={view}
        onChange={setView}
        options={VIEWS.map((v) => ({
          value: v.value,
          label: counts[v.value] === null ? v.label : `${v.label} (${counts[v.value]})`,
        }))}
      />

      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            {active.heading}
            <InfoTip label={active.label}>{active.tip}</InfoTip>
          </span>
        }
        description={active.hint}
      />

      {/* Keyed so React remounts and the entrance plays. */}
      <div key={view} className="motion-safe:animate-rise">
        {view === 'rubric' && <CpiEvaluationConfig cpiId={cpiId} />}
        {view === 'live' && <StageLiveSettings cpiId={cpiId} />}
        {view === 'panels' && <CpiSessionPanels cpiId={cpiId} />}
      </div>
    </div>
  );
}
