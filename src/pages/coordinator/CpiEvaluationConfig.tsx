import { cloneElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import {
  useEvaluationConfig,
  useSetEvaluationConfig,
  useAssignStageEvaluator,
  type ConfigInputStage,
  type CriterionLevel,
  type PanelScoreVisibility,
} from '@/features/evaluations/useEvaluationConfig';
import { PANEL_ROLES, roleLabel, type MarkCounting, type PanelRole } from '@/features/panel/usePanel';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName, shortName } from '@/lib/name';
import { Badge, Button, Card, Disclosure, InfoTip, Meter, Notice, Segmented } from '@/components/ui';

type EditCriterion = { name: string; description: string; weight: number; maxScore: number; level: CriterionLevel };
// A stage's expected composition. Minimum 0 on every role with openToAll set is
// the open event: nobody assigned, whoever attends may mark.
type EditPanelRule = {
  role: PanelRole;
  minRequired: number;
  maxAllowed: string;
  markCounting: MarkCounting;
  openToAll: boolean;
};
type EditSegment = { name: string; targetSeconds: number };
type EditStage = {
  name: string;
  weight: number;
  panelScoreVisibility: PanelScoreVisibility;
  panelRules: EditPanelRule[];
  timerSegments: EditSegment[];
  submissionRequired: boolean;
  // datetime-local strings ('' = unset); each pair is sent only if both are set.
  submissionWindowStart: string;
  submissionWindowEnd: string;
  executionWindowStart: string;
  executionWindowEnd: string;
  criteria: EditCriterion[];
};

// datetime-local ('YYYY-MM-DDTHH:mm') → ISO, or undefined when blank.
const toIso = (v: string): string | undefined => (v ? new Date(v).toISOString() : undefined);

const defaultRule = (role: PanelRole, minRequired: number): EditPanelRule => ({
  role,
  minRequired,
  maxAllowed: '',
  markCounting: 'COUNTED',
  openToAll: false,
});

const EMPTY_WINDOWS = {
  submissionWindowStart: '',
  submissionWindowEnd: '',
  executionWindowStart: '',
  executionWindowEnd: '',
};

const DEFAULT_STAGES: EditStage[] = [
  {
    name: 'Proposal',
    weight: 40,
    panelScoreVisibility: 'ISOLATED',
    panelRules: [defaultRule('EVALUATOR', 1)],
    timerSegments: [],
    submissionRequired: true,
    ...EMPTY_WINDOWS,
    criteria: [
      { name: 'Clarity', description: '', weight: 50, maxScore: 10, level: 'GROUP' },
      { name: 'Feasibility', description: '', weight: 50, maxScore: 10, level: 'GROUP' },
    ],
  },
  {
    name: 'Final',
    weight: 60,
    panelScoreVisibility: 'ISOLATED',
    panelRules: [defaultRule('EVALUATOR', 1)],
    timerSegments: [],
    submissionRequired: false,
    ...EMPTY_WINDOWS,
    criteria: [{ name: 'Implementation', description: '', weight: 100, maxScore: 100, level: 'GROUP' }],
  },
];

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

const VISIBILITY_LABEL: Record<PanelScoreVisibility, string> = {
  ISOLATED: 'only to each panelist',
  OPEN_WITH_NAMES: 'to the whole panel, with names',
  OPEN_ANONYMOUS: 'to the whole panel, anonymously',
};

type StageTab = 'basics' | 'criteria' | 'panel' | 'timing' | 'dates';

const STAGE_TABS: { value: StageTab; label: string }[] = [
  { value: 'basics', label: 'Basics' },
  { value: 'criteria', label: 'Criteria' },
  { value: 'panel', label: 'Panel' },
  { value: 'timing', label: 'Presentation' },
  { value: 'dates', label: 'Dates' },
];

const COUNTING_LABEL: Record<MarkCounting, string> = {
  COUNTED: 'marks count',
  ADVISORY: 'advisory only',
  COORDINATOR_DECIDES: 'pooled, coordinator weights',
};

/* Small form pieces: a real label on every control, without losing density. */

const cellInput = 'h-9 px-2.5 text-sm';

function Labelled({
  label,
  hint,
  tip,
  children,
  className,
}: {
  label: string;
  hint?: string;
  /** Shown behind a round "i" beside the label, for a setting whose effect is
   *  not guessable from its name. */
  tip?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // With a tip the wrapper cannot be a <label>: it holds a button.
  const id = useId();
  const Wrapper = tip ? 'div' : 'label';

  return (
    <Wrapper className={`flex min-w-0 flex-col gap-1 ${className ?? ''}`}>
      <span className="flex items-center gap-1.5">
        {/* Without a tip the wrapper is the <label>, so this must be a span. */}
        {tip ? (
          <label
            htmlFor={id}
            className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle"
          >
            {label}
          </label>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            {label}
          </span>
        )}
        {tip && (
          <InfoTip label={label}>{tip}</InfoTip>
        )}
      </span>
      {tip ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}
      {hint && <span className="text-[11px] text-ink-subtle">{hint}</span>}
    </Wrapper>
  );
}

/** The heading for one of the four areas inside a stage. */
function StageSection({
  title,
  hint,
  tip,
  children,
}: {
  title: string;
  hint?: string;
  tip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-5 motion-safe:animate-rise">
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-eyebrow text-brand-700">
        {title}
        {tip && <InfoTip label={title}>{tip}</InfoTip>}
      </h4>
      {hint && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * Up and down arrows on a stage's summary row. Not drag-and-drop: this list is
 * three or four items, it is edited on a laptop trackpad as often as a mouse,
 * and a drag target has no keyboard equivalent without building one.
 *
 * `stopPropagation` because the whole summary row is the disclosure's toggle —
 * without it, moving a stage would also fold it.
 */
function MoveControls({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
}) {
  const base =
    'flex h-6 w-6 items-center justify-center rounded-control text-ink-subtle transition-colors duration-fast ease-standard hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-30';

  return (
    <span className="flex items-center gap-0.5">
      {([-1, 1] as const).map((delta) => (
        <button
          key={delta}
          type="button"
          disabled={delta === -1 ? index === 0 : index === count - 1}
          aria-label={delta === -1 ? 'Move this stage earlier' : 'Move this stage later'}
          title={delta === -1 ? 'Move earlier' : 'Move later'}
          onClick={(e) => {
            e.stopPropagation();
            onMove(delta);
          }}
          className={base}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={delta === -1 ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6'} />
          </svg>
        </button>
      ))}
    </span>
  );
}

/** A removable row — panel role, running-order segment, criterion. */
function Row({ children, onRemove, removeLabel }: { children: ReactNode; onRemove?: () => void; removeLabel: string }) {
  return (
    <div className="flex flex-wrap items-end gap-2.5 rounded-control border border-line bg-canvas-sunken p-3">
      {children}
      {onRemove && (
        <Button
          variant="danger-quiet"
          size="sm"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className="ml-auto text-critical-700 hover:bg-critical-50 hover:text-critical-700"
        >
          Remove
        </Button>
      )}
    </div>
  );
}

export function CpiEvaluationConfig({ cpiId }: { cpiId: string }) {
  const { data: saved } = useEvaluationConfig(cpiId);
  const { data: cpi } = useCpiDetail(cpiId);
  const setConfig = useSetEvaluationConfig(cpiId);
  const assignEvaluator = useAssignStageEvaluator(cpiId);

  // The CPI's evaluator pool — stage evaluators must come from here.
  const evaluatorPool = cpi?.evaluators ?? [];

  const [stages, setStages] = useState<EditStage[]>(DEFAULT_STAGES);
  const [evaluatorInputs, setEvaluatorInputs] = useState<Record<string, string>>({});
  // One stage open at a time, and one area of that stage at a time.
  const [openStage, setOpenStage] = useState<number | null>(0);
  const [stageTab, setStageTab] = useState<StageTab>('basics');

  const openStageAt = (si: number | null) => {
    setOpenStage(si);
    setStageTab('basics');
  };

  const stageWeightSum = sum(stages.map((s) => s.weight));
  const stageWeightsOk = stageWeightSum === 100;
  const criteriaOk = stages.every((s) => sum(s.criteria.map((c) => c.weight)) === 100);
  const canSave = stageWeightsOk && criteriaOk && stages.length > 0;

  const updateStage = (i: number, patch: Partial<EditStage>) =>
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateRule = (si: number, ri: number, patch: Partial<EditPanelRule>) =>
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, panelRules: s.panelRules.map((r, rIdx) => (rIdx === ri ? { ...r, ...patch } : r)) }
          : s,
      ),
    );
  const updateSegment = (si: number, gi: number, patch: Partial<EditSegment>) =>
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, timerSegments: s.timerSegments.map((g, gIdx) => (gIdx === gi ? { ...g, ...patch } : g)) }
          : s,
      ),
    );
  const updateCriterion = (si: number, ci: number, patch: Partial<EditCriterion>) =>
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, criteria: s.criteria.map((c, cIdx) => (cIdx === ci ? { ...c, ...patch } : c)) }
          : s,
      ),
    );

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      {
        name: '',
        weight: 0,
        panelScoreVisibility: 'ISOLATED',
        panelRules: [defaultRule('EVALUATOR', 1)],
        timerSegments: [],
        submissionRequired: false,
        ...EMPTY_WINDOWS,
        criteria: [{ name: '', description: '', weight: 100, maxScore: 10, level: 'GROUP' }],
      },
    ]);
    openStageAt(stages.length);
  };

  // Stages run in the order listed; the server takes it from this array's index.
  const moveStage = (si: number, delta: -1 | 1) => {
    const target = si + delta;
    if (target < 0 || target >= stages.length) return;
    setStages((prev) => {
      const next = [...prev];
      [next[si], next[target]] = [next[target], next[si]];
      return next;
    });
    // Follow the stage rather than the position, so the one being moved stays
    // the open one.
    setOpenStage(target);
  };

  const removeStage = (si: number) => {
    setStages((prev) => prev.filter((_, idx) => idx !== si));
    openStageAt(null);
  };

  const save = () => {
    const payload: ConfigInputStage[] = stages.map((s) => ({
      name: s.name,
      weight: s.weight,
      panelScoreVisibility: s.panelScoreVisibility,
      panelRules: s.panelRules.map((r) => ({
        role: r.role,
        minRequired: r.minRequired,
        maxAllowed: r.maxAllowed ? Number(r.maxAllowed) : null,
        markCounting: r.markCounting,
        openToAll: r.openToAll,
      })),
      timerSegments: s.timerSegments,
      submissionRequired: s.submissionRequired,
      submissionWindowStart: toIso(s.submissionWindowStart),
      submissionWindowEnd: toIso(s.submissionWindowEnd),
      executionWindowStart: toIso(s.executionWindowStart),
      executionWindowEnd: toIso(s.executionWindowEnd),
      criteria: s.criteria.map((c) => ({
        name: c.name,
        description: c.description || undefined,
        weight: c.weight,
        maxScore: c.maxScore,
        level: c.level,
      })),
    }));
    setConfig.mutate(payload);
  };

  return (
    <div className="space-y-4">
      {/* The two rules that decide whether Save works, next to the button. */}
      <Card accent className="sticky top-16 z-10">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
              Rubric
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {stages.length} {stages.length === 1 ? 'stage' : 'stages'}. Weights must total 100
              across the course and again within each stage.
            </p>
          </div>

          <Meter
            label="Stage weights"
            value={stageWeightSum}
            target={100}
            className="w-full max-w-xs"
          />

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" onClick={addStage}>
              Add a stage
            </Button>
            <Button onClick={save} disabled={!canSave || setConfig.isPending}>
              {setConfig.isPending ? 'Saving…' : 'Save rubric'}
            </Button>
          </div>
        </div>

        {!canSave && (
          <p className="mt-3 border-t border-line pt-3 text-xs text-caution-700">
            {!stageWeightsOk && 'Stage weights do not total 100. '}
            {!criteriaOk && 'At least one stage’s criteria do not total 100. '}
            Saving is held until they do.
          </p>
        )}
      </Card>

      {setConfig.isError && <Notice tone="critical">{getApiErrorMessage(setConfig.error)}</Notice>}
      {setConfig.isSuccess && <Notice tone="positive">Rubric saved.</Notice>}

      <div className="space-y-2.5">
        {stages.map((stage, si) => {
          const critSum = sum(stage.criteria.map((c) => c.weight));
          const panelSize = sum(stage.panelRules.map((r) => r.minRequired));
          const openEvent = stage.panelRules.some((r) => r.openToAll);
          const hasPresentation = stage.timerSegments.length > 0;

          return (
            <Disclosure
              key={si}
              open={openStage === si}
              onOpenChange={(next) => openStageAt(next ? si : null)}
              invalid={critSum !== 100}
              summary={stage.name || `Stage ${si + 1}`}
              meta={
                <>
                  <Badge tone="brand">{stage.weight}% of the course</Badge>
                  <Badge tone="neutral">
                    {stage.criteria.length}{' '}
                    {stage.criteria.length === 1 ? 'criterion' : 'criteria'}
                  </Badge>
                  {critSum !== 100 && <Badge tone="critical">criteria {critSum}/100</Badge>}
                  {stage.submissionRequired && <Badge tone="info">submission</Badge>}
                  {hasPresentation && <Badge tone="neutral">presentation</Badge>}
                  {openEvent && <Badge tone="caution">open to join</Badge>}
                </>
              }
              aside={
                <>
                  <span className="hidden text-xs text-ink-subtle sm:inline">
                    {panelSize > 0 ? `${panelSize} required` : 'no minimum'}
                  </span>
                  {stages.length > 1 && (
                    <MoveControls
                      index={si}
                      count={stages.length}
                      onMove={(delta) => moveStage(si, delta)}
                    />
                  )}
                </>
              }
            >
              {/* One area at a time; stacked, they are a wall. */}
              <div className="border-b border-line bg-surface px-5 py-3.5">
                <Segmented
                  label={`${stage.name || `Stage ${si + 1}`} settings`}
                  value={stageTab}
                  onChange={setStageTab}
                  options={STAGE_TABS.map((t) => ({
                    value: t.value,
                    // The criteria total blocks saving, so it shows on the tab.
                    label:
                      t.value === 'criteria' && critSum !== 100
                        ? `${t.label} (${critSum}/100)`
                        : t.label,
                  }))}
                />
              </div>

              {stageTab === 'basics' && (
              <StageSection title="The stage">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Labelled label="Name" className="sm:col-span-2">
                    <input
                      value={stage.name}
                      onChange={(e) => updateStage(si, { name: e.target.value })}
                      placeholder="Proposal"
                      className={cellInput}
                    />
                  </Labelled>
                  <Labelled label="Weight" hint="Share of the course total.">
                    <input
                      type="number"
                      value={stage.weight}
                      onChange={(e) => updateStage(si, { weight: Number(e.target.value) })}
                      className={cellInput}
                    />
                  </Labelled>
                  <Labelled
                    label="Scores visible"
                    tip="Who can see a panelist's scores before the session is closed. Isolated is the default and keeps panelists from influencing each other. Open shows the panel each other's marks as they go — with names, or anonymously. The scoring screen tells evaluators which applies."
                  >
                    <select
                      value={stage.panelScoreVisibility}
                      onChange={(e) =>
                        updateStage(si, { panelScoreVisibility: e.target.value as PanelScoreVisibility })
                      }
                      className={cellInput}
                    >
                      {(Object.keys(VISIBILITY_LABEL) as PanelScoreVisibility[]).map((v) => (
                        <option key={v} value={v}>
                          {VISIBILITY_LABEL[v]}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                </div>

                <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-brand-50">
                  <input
                    type="checkbox"
                    checked={stage.submissionRequired}
                    onChange={(e) => updateStage(si, { submissionRequired: e.target.checked })}
                  />
                  This stage needs a file uploaded
                </label>

                {stages.length > 1 && (
                  <div className="mt-4 border-t border-line pt-3">
                    <Button
                      variant="danger-quiet"
                      size="sm"
                      onClick={() => removeStage(si)}
                    >
                      Remove this stage
                    </Button>
                  </div>
                )}
              </StageSection>
              )}

              {stageTab === 'dates' && (
              <StageSection
                title="Its own dates"
                hint="Leave blank to use the phase window. Set both ends to give this stage its own time."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Labelled label="Submission opens">
                    <input
                      type="datetime-local"
                      value={stage.submissionWindowStart}
                      onChange={(e) => updateStage(si, { submissionWindowStart: e.target.value })}
                      className={cellInput}
                    />
                  </Labelled>
                  <Labelled label="Submission closes">
                    <input
                      type="datetime-local"
                      value={stage.submissionWindowEnd}
                      onChange={(e) => updateStage(si, { submissionWindowEnd: e.target.value })}
                      className={cellInput}
                    />
                  </Labelled>
                  <Labelled label="Scoring opens">
                    <input
                      type="datetime-local"
                      value={stage.executionWindowStart}
                      onChange={(e) => updateStage(si, { executionWindowStart: e.target.value })}
                      className={cellInput}
                    />
                  </Labelled>
                  <Labelled label="Scoring closes">
                    <input
                      type="datetime-local"
                      value={stage.executionWindowEnd}
                      onChange={(e) => updateStage(si, { executionWindowEnd: e.target.value })}
                      className={cellInput}
                    />
                  </Labelled>
                </div>
              </StageSection>
              )}

              {stageTab === 'panel' && (
              <StageSection
                title="Panel"
                hint="With no role required, the session stays open until you close it at review — which is what an open demonstration day needs, since people arrive and leave."
              >
                <div className="space-y-2">
                  {stage.panelRules.map((rule, ri) => (
                    <Row
                      key={ri}
                      removeLabel="Remove this panel role"
                      onRemove={() =>
                        updateStage(si, { panelRules: stage.panelRules.filter((_, idx) => idx !== ri) })
                      }
                    >
                      <Labelled label="Role" className="w-44">
                        <select
                          value={rule.role}
                          onChange={(e) => updateRule(si, ri, { role: e.target.value as PanelRole })}
                          className={cellInput}
                        >
                          {PANEL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      </Labelled>
                      <Labelled
                        label="Minimum"
                        className="w-24"
                        tip="How many people in this role the stage expects. Nothing advances by itself — this is the readiness figure the reviewer sees before deciding to close scoring. Zero means the role is optional."
                      >
                        <input
                          type="number"
                          min={0}
                          value={rule.minRequired}
                          onChange={(e) => updateRule(si, ri, { minRequired: Number(e.target.value) })}
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled label="Maximum" className="w-24" hint="Blank = no limit">
                        <input
                          type="number"
                          min={1}
                          value={rule.maxAllowed}
                          onChange={(e) => updateRule(si, ri, { maxAllowed: e.target.value })}
                          placeholder="any"
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled
                        label="Their marks"
                        className="w-56"
                        tip="How this role's scores are used. Counted goes into the weighted average. Advisory is recorded and shown but contributes nothing. Pooled gathers everyone in the role into one contribution, weighted by a share you set under Live settings — that is how a crowd at an open event cannot outvote the formal panel."
                      >
                        <select
                          value={rule.markCounting}
                          onChange={(e) =>
                            updateRule(si, ri, { markCounting: e.target.value as MarkCounting })
                          }
                          className={cellInput}
                        >
                          {(Object.keys(COUNTING_LABEL) as MarkCounting[]).map((m) => (
                            <option key={m} value={m}>
                              {COUNTING_LABEL[m]}
                            </option>
                          ))}
                        </select>
                      </Labelled>
                      <div className="flex h-9 items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={rule.openToAll}
                            onChange={(e) => updateRule(si, ri, { openToAll: e.target.checked })}
                          />
                          Anyone may join
                        </label>
                        <InfoTip label="Anyone may join">
                          Lets a lecturer who holds no seat mark this stage — the open
                          demonstration day. Their marks are pooled into a single capped
                          contribution, so numbers alone cannot outweigh the formal panel.
                        </InfoTip>
                      </div>
                    </Row>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() =>
                    updateStage(si, {
                      panelRules: [...stage.panelRules, defaultRule('SENIOR_EVALUATOR', 0)],
                    })
                  }
                >
                  + Add a panel role
                </Button>
              </StageSection>
              )}

              {stageTab === 'timing' && (
              <StageSection title="Presentation">
                {/* Not every stage is presented. No segments means no
                    presentation; one or more means there is one. */}
                <div className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-canvas-sunken p-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={hasPresentation}
                      onChange={(e) =>
                        updateStage(si, {
                          timerSegments: e.target.checked
                            ? [{ name: 'Presentation', targetSeconds: 600 }]
                            : [],
                        })
                      }
                    />
                    This stage includes a presentation
                  </label>
                  <InfoTip label="Presentation">
                    Turn this off for a stage marked from a submission alone — a report or a
                    design document. The panel still scores it, and it still has its own session;
                    there is simply no clock to run. Turning it on gives the stage a running order
                    the presentation clock steps through.
                  </InfoTip>
                </div>

                {!hasPresentation && (
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-ink-muted">
                    Evaluators will score this stage without a timer, and the projector window is
                    not offered for it.
                  </p>
                )}

                {hasPresentation && (
                <>
                <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-muted">
                  The parts the clock steps through. Segments never advance on their own — passing
                  a target starts counting the overrun, and whoever runs the room presses Next.
                </p>
                <div className="mt-3 space-y-2">
                  {stage.timerSegments.map((segment, gi) => (
                    <Row
                      key={gi}
                      removeLabel="Remove this segment"
                      onRemove={() =>
                        updateStage(si, {
                          timerSegments: stage.timerSegments.filter((_, idx) => idx !== gi),
                        })
                      }
                    >
                      <Labelled label="Segment" className="w-56">
                        <input
                          value={segment.name}
                          onChange={(e) => updateSegment(si, gi, { name: e.target.value })}
                          placeholder="Presentation"
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled label="Minutes" className="w-28">
                        <input
                          type="number"
                          min={1}
                          value={Math.round(segment.targetSeconds / 60)}
                          onChange={(e) =>
                            updateSegment(si, gi, { targetSeconds: Number(e.target.value) * 60 })
                          }
                          className={cellInput}
                        />
                      </Labelled>
                    </Row>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() =>
                    updateStage(si, {
                      timerSegments: [...stage.timerSegments, { name: '', targetSeconds: 600 }],
                    })
                  }
                >
                  + Add a segment
                </Button>
                </>
                )}
              </StageSection>
              )}

              {stageTab === 'criteria' && (
              <StageSection
                title="Criteria"
                hint="Each criterion is a share of this stage. A criterion marked per student is what lets two people in one group get different marks."
              >
                <Meter
                  label="Criteria weights"
                  value={critSum}
                  target={100}
                  className="mb-3 max-w-xs"
                />

                <div className="space-y-2">
                  {stage.criteria.map((c, ci) => (
                    <Row
                      key={ci}
                      removeLabel="Remove this criterion"
                      onRemove={
                        stage.criteria.length > 1
                          ? () =>
                              updateStage(si, {
                                criteria: stage.criteria.filter((_, idx) => idx !== ci),
                              })
                          : undefined
                      }
                    >
                      <Labelled label="Criterion" className="min-w-48 flex-1">
                        <input
                          value={c.name}
                          onChange={(e) => updateCriterion(si, ci, { name: e.target.value })}
                          placeholder="Clarity"
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled label="Weight" className="w-24">
                        <input
                          type="number"
                          value={c.weight}
                          onChange={(e) => updateCriterion(si, ci, { weight: Number(e.target.value) })}
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled
                        label="Out of"
                        className="w-24"
                        tip="The highest score a panelist can give. The score is turned into a percentage of this figure before the weight is applied, so 8/10 and 80/100 are the same thing."
                      >
                        <input
                          type="number"
                          value={c.maxScore}
                          onChange={(e) => updateCriterion(si, ci, { maxScore: Number(e.target.value) })}
                          className={cellInput}
                        />
                      </Labelled>
                      <Labelled
                        label="Marked"
                        className="w-40"
                        tip="Whole group gives every member the same score for this criterion. Per student gives each member their own, and is the only way two people in one group end up with different marks."
                      >
                        <select
                          value={c.level}
                          onChange={(e) =>
                            updateCriterion(si, ci, { level: e.target.value as CriterionLevel })
                          }
                          className={cellInput}
                        >
                          <option value="GROUP">whole group</option>
                          <option value="INDIVIDUAL">per student</option>
                        </select>
                      </Labelled>
                    </Row>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() =>
                    updateStage(si, {
                      criteria: [
                        ...stage.criteria,
                        { name: '', description: '', weight: 0, maxScore: 10, level: 'GROUP' },
                      ],
                    })
                  }
                >
                  + Add a criterion
                </Button>
              </StageSection>
              )}
            </Disclosure>
          );
        })}
      </div>

      <SavedRubric
        saved={saved}
        evaluatorPool={evaluatorPool}
        evaluatorInputs={evaluatorInputs}
        setEvaluatorInputs={setEvaluatorInputs}
        assignEvaluator={assignEvaluator}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* What is actually stored, and who marks it                                  */
/* -------------------------------------------------------------------------- */

type AssignEvaluator = ReturnType<typeof useAssignStageEvaluator>;

/** What is stored, as a table, with each stage's evaluator assignment on its row. */
function SavedRubric({
  saved,
  evaluatorPool,
  evaluatorInputs,
  setEvaluatorInputs,
  assignEvaluator,
}: {
  saved: ReturnType<typeof useEvaluationConfig>['data'];
  evaluatorPool: NonNullable<ReturnType<typeof useCpiDetail>['data']>['evaluators'];
  evaluatorInputs: Record<string, string>;
  setEvaluatorInputs: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  assignEvaluator: AssignEvaluator;
}) {
  if (!saved || saved.length === 0) return null;

  return (
    <Card
      title="Saved rubric"
      description="What the course is actually running on, and who marks each stage."
    >
      <div className="space-y-2.5">
        {saved.map((stage) => (
          <Disclosure
            key={stage.id}
            summary={stage.name}
            meta={
              <>
                <Badge tone="brand">{stage.weight}%</Badge>
                {stage.submissionRequired && <Badge tone="info">submission</Badge>}
                <Badge tone={stage.evaluators.length ? 'neutral' : 'caution'}>
                  {stage.evaluators.length
                    ? `${stage.evaluators.length} ${stage.evaluators.length === 1 ? 'evaluator' : 'evaluators'}`
                    : 'no evaluators'}
                </Badge>
              </>
            }
          >
            <div className="px-4 py-4">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th className="text-right">Weight</th>
                      <th className="text-right">Out of</th>
                      <th>Marked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stage.criteria.map((c) => (
                      <tr key={c.id}>
                        <th scope="row">{c.name}</th>
                        <td className="text-right">{c.weight}%</td>
                        <td className="text-right">{c.maxScore}</td>
                        <td>{c.level === 'INDIVIDUAL' ? 'per student' : 'whole group'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
                  Evaluators
                </p>
                <p className="mt-1.5 text-sm text-ink">
                  {stage.evaluators.length
                    ? stage.evaluators.map((e) => shortName(personName(e.cpiEvaluator.lecturer.user))).join(', ')
                    : 'Nobody assigned yet.'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Add an evaluator to ${stage.name}`}
                    value={evaluatorInputs[stage.id] ?? ''}
                    onChange={(e) =>
                      setEvaluatorInputs((p) => ({ ...p, [stage.id]: e.target.value }))
                    }
                    className="h-9 px-2.5 text-sm"
                  >
                    <option value="">Select an evaluator…</option>
                    {evaluatorPool.map((ev) => (
                      <option key={ev.id} value={ev.lecturer.user.id}>
                        {personName(ev.lecturer.user)}
                        {ev.isHeadJudge ? ' (Head Judge)' : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() =>
                      assignEvaluator.mutate(
                        { stageId: stage.id, lecturerUserId: evaluatorInputs[stage.id] ?? '' },
                        { onSuccess: () => setEvaluatorInputs((p) => ({ ...p, [stage.id]: '' })) },
                      )
                    }
                    disabled={!evaluatorInputs[stage.id] || assignEvaluator.isPending}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          </Disclosure>
        ))}
      </div>

      {assignEvaluator.isError && (
        <Notice tone="critical" size="xs" className="mt-3">
          {getApiErrorMessage(assignEvaluator.error)}
        </Notice>
      )}
    </Card>
  );
}
