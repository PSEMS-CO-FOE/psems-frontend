import { useEffect, useState } from 'react';
import {
  PRESET_EFFECTS,
  useApplyPreset,
  useCpiPolicy,
  useUpdateCpiPolicy,
  type CpiPolicy,
} from '@/features/policy/usePolicy';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { statusOfPhases } from '@/features/courses/phaseStatus';
import type { CpiMode, CpiPhaseName } from '@/features/courses/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, Select, Skeleton } from '@/components/ui';

type BoolKey = { [K in keyof CpiPolicy]: CpiPolicy[K] extends boolean ? K : never }[keyof CpiPolicy];
type NumKey = { [K in keyof CpiPolicy]: CpiPolicy[K] extends number | null ? K : never }[keyof CpiPolicy];

interface Group {
  title: string;
  hint: string;
  /** The timeline phases this group governs, so the group in play can be marked. */
  phases: CpiPhaseName[];
  toggles: { key: BoolKey; label: string; hint?: string }[];
  numbers?: { key: NumKey; label: string; hint: string; min?: number; max?: number; suffix?: string }[];
}

const GROUPS: Group[] = [
  {
    title: 'Ideas',
    hint: 'Who may post a project idea, and on what terms.',
    phases: ['IDEA_ANNOUNCEMENT'],
    toggles: [
      { key: 'allowStudentIdeas', label: 'Students may post ideas' },
      { key: 'studentIdeasLeaderOnly', label: 'Only the group leader posts the group’s idea' },
      { key: 'allowSupervisorIdeas', label: 'Supervisors may post ideas' },
      { key: 'allowCoordinatorIdeas', label: 'The coordinator may post ideas' },
      {
        key: 'allowLecturerIdeas',
        label: 'Any lecturer may post ideas',
        hint: 'Including lecturers who are not supervising this course.',
      },
      { key: 'requireStudentIdeaApproval', label: 'Student ideas need approval' },
      { key: 'allowCoSupervisorOnIdea', label: 'An idea may name a co-supervisor' },
    ],
    numbers: [{ key: 'maxIdeasPerGroup', label: 'Ideas per group', hint: 'Leave blank for no limit.', min: 1 }],
  },
  {
    title: 'Selection',
    hint: 'Expression of interest and who confirms a group’s project.',
    phases: ['PROJECT_SELECTION', 'PROJECT_REGISTRATION'],
    toggles: [
      { key: 'interestEnabled', label: 'Groups and lecturers may express interest' },
      { key: 'allowInterestWithdrawal', label: 'Interest may be withdrawn while the phase is open' },
      { key: 'studentsSeeOtherGroupIdeas', label: 'Students can see other groups’ ideas' },
      {
        key: 'allowSupervisorSelfRequest',
        label: 'Lecturers may ask to join this course as a supervisor',
      },
      {
        key: 'allowLecturerInterestInGroupIdeas',
        label: 'Lecturers may express interest in a group’s idea',
        hint: 'Interest runs both ways rather than students choosing alone.',
      },
      { key: 'allowCoSupervisionInterest', label: 'Lecturers may offer to co-supervise someone else’s idea' },
    ],
    numbers: [{ key: 'maxInterestsPerGroup', label: 'Interests per group', hint: 'Leave blank for no limit.', min: 1 }],
  },
  {
    title: 'Participation',
    hint: 'Whether a student may take part without a group — including on a group course.',
    phases: ['STUDENT_REGISTRATION'],
    toggles: [
      { key: 'allowIndividualParticipation', label: 'Students may take part individually' },
    ],
    numbers: [
      {
        key: 'targetGroupSize',
        label: 'Group size',
        hint: 'A guide, not a limit. A batch rarely divides evenly, so a group over or under this is flagged on the roster rather than refused.',
        min: 1,
        max: 20,
      },
    ],
  },
  {
    title: 'Evaluation',
    hint: 'How evaluations are reviewed and recorded.',
    phases: ['EVALUATION_CONFIG', 'EVALUATION_EXECUTION'],
    toggles: [
      { key: 'headJudgeEnabled', label: 'Use a Head Judge (otherwise the coordinator reviews)' },
      { key: 'requireOverallComment', label: 'An overall comment is required with every evaluation' },
    ],
  },
  {
    title: 'Results',
    hint: 'What students eventually receive. Grade bands are set on the Marks screen. A final year project normally needs only the grade switch — leave both figures below blank.',
    phases: ['FINAL_SUBMISSION'],
    toggles: [{ key: 'gradingEnabled', label: 'Award a grade' }],
    numbers: [
      {
        key: 'passMarkPercent',
        label: 'Pass mark',
        hint: 'Optional, and for your eyes only: students below it are marked on your sheet. PSEMS never tells a student they have been repeated — that decision is yours to make and to communicate. Leave blank for a final year project.',
        min: 0,
        max: 100,
        suffix: '%',
      },
      {
        key: 'caContributionPercent',
        label: 'Contribution to the module',
        hint: 'Leave blank when this course is the whole module, which is the usual case for a final year project. Set it only when the project is one CA component of a larger module — students then see what their mark contributes. Setting it below 100 also stops grades being awarded here, because the module’s letter is then decided elsewhere.',
        min: 0,
        max: 100,
        suffix: '%',
      },
    ],
  },
];

const PRESET_LABEL: Record<Exclude<CpiMode, null>, string> = {
  SUPERVISOR_LED: 'Supervisor-led',
  COORDINATOR_MANAGED: 'Coordinator-managed',
};

function Toggle({
  checked,
  label,
  hint,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-control px-2 py-1.5 hover:bg-brand-50">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-subtle">{hint}</span>}
      </span>
    </label>
  );
}

/** A nullable number setting. Committed on blur rather than per keystroke, so
 *  typing "10" does not first save a limit of 1. */
function NumberSetting({
  value,
  label,
  hint,
  min,
  max,
  suffix,
  disabled,
  onCommit,
}: {
  value: number | null;
  label: string;
  hint: string;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  onCommit: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  useEffect(() => setDraft(value === null ? '' : String(value)), [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      if (value !== null) onCommit(null);
      return;
    }
    const next = Number(trimmed);
    if (Number.isNaN(next)) {
      setDraft(value === null ? '' : String(value));
      return;
    }
    if (next !== value) onCommit(next);
  };

  return (
    <div className="px-2 py-1.5">
      <label className="block text-sm text-ink">
        {label}
        <span className="mt-1 flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft}
            disabled={disabled}
            placeholder="no limit"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            className="w-28 rounded-control border border-line-strong bg-surface px-2 py-1 text-sm disabled:bg-canvas-sunken"
          />
          {suffix && <span className="text-sm text-ink-muted">{suffix}</span>}
        </span>
      </label>
      <p className="mt-1 text-xs text-ink-subtle">{hint}</p>
    </div>
  );
}

export function CourseSettingsPanel({ cpiId }: { cpiId: string }) {
  const { data: policy, isLoading } = useCpiPolicy(cpiId);
  const { data: cpi } = useCpiDetail(cpiId);
  const update = useUpdateCpiPolicy(cpiId);
  const preset = useApplyPreset(cpiId);

  // Null until the coordinator touches a group: the default is derived from the
  // phase the course is in, so the screen opens on the settings that matter now
  // rather than on all twenty-odd at once.
  const [openGroups, setOpenGroups] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState<Exclude<CpiMode, null> | null>(null);

  const currentGroups = GROUPS.filter((g) => statusOfPhases(cpi?.timeline, g.phases) === 'open').map((g) => g.title);
  const expanded = openGroups ?? (currentGroups.length > 0 ? currentGroups : [GROUPS[0].title]);
  const toggleGroup = (title: string) =>
    setOpenGroups(expanded.includes(title) ? expanded.filter((t) => t !== title) : [...expanded, title]);

  if (isLoading) return <Skeleton className="h-64" />;
  if (!policy) return null;

  const busy = update.isPending || preset.isPending;

  return (
    <Card
      title="Course settings"
      description="These decide how this course behaves. Start from a preset, then change anything you like — nothing here is locked in by adding supervisors or by the phase you are in."
      actions={
        <Button variant="neutral" size="sm" onClick={() => setOpenGroups(GROUPS.map((g) => g.title))}>
          Expand all
        </Button>
      }
    >
      {update.isError && (
        <Notice tone="critical" className="mb-3">
          {getApiErrorMessage(update.error)}
        </Notice>
      )}
      {preset.isError && (
        <Notice tone="critical" className="mb-3">
          {getApiErrorMessage(preset.error)}
        </Notice>
      )}

      {/* Preset first: one click covers the common case, and the groups below
          stay available for everything the two presets do not anticipate. */}
      <div className="rounded-control border border-line bg-canvas/60 p-3">
        <p className="text-xs font-medium text-ink">Preset</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          A preset writes five settings and leaves the rest alone. Applying one again is how you reset an area you have
          edited into a corner.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(Object.keys(PRESET_LABEL) as Exclude<CpiMode, null>[]).map((mode) => (
            <Button
              key={mode}
              variant={cpi?.mode === mode ? 'primary' : 'neutral'}
              size="sm"
              disabled={busy}
              onClick={() => setConfirming(confirming === mode ? null : mode)}
            >
              {PRESET_LABEL[mode]}
              {cpi?.mode === mode && ' · in use'}
            </Button>
          ))}
          {!cpi?.mode && <Badge>no preset applied</Badge>}
        </div>

        {confirming && (
          <div className="mt-3 rounded-control border border-line-strong bg-surface p-3">
            <p className="text-xs font-medium text-ink">Applying “{PRESET_LABEL[confirming]}” will set:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {PRESET_EFFECTS[confirming].map((e) => (
                <li key={e} className="text-xs text-ink-muted">
                  {e}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-subtle">Everything else stays as you set it.</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => preset.mutate(confirming, { onSuccess: () => setConfirming(null) })}
              >
                {preset.isPending ? '…' : 'Apply preset'}
              </Button>
              <Button variant="neutral" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {GROUPS.map((group) => {
          const isOpen = expanded.includes(group.title);
          const inPlay = currentGroups.includes(group.title);
          return (
            <div key={group.title} className="rounded-control border border-line">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-brand-50"
              >
                <span className="text-sm font-medium text-ink">{group.title}</span>
                {inPlay && <Badge tone="brand">this phase is open</Badge>}
                <span className="ml-auto text-xs text-ink-subtle" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line px-1 py-1">
                  <p className="px-2 py-1 text-xs text-ink-subtle">{group.hint}</p>
                  {group.toggles.map((t) => (
                    <Toggle
                      key={t.key}
                      label={t.label}
                      hint={t.hint}
                      checked={policy[t.key]}
                      disabled={busy}
                      onChange={(v) => update.mutate({ [t.key]: v } as Partial<CpiPolicy>)}
                    />
                  ))}
                  {group.numbers?.map((n) => (
                    <NumberSetting
                      key={n.key}
                      label={n.label}
                      hint={n.hint}
                      min={n.min}
                      max={n.max}
                      suffix={n.suffix}
                      value={policy[n.key]}
                      disabled={busy}
                      onCommit={(v) => update.mutate({ [n.key]: v } as Partial<CpiPolicy>)}
                    />
                  ))}

                  {group.title === 'Selection' && (
                    <div className="px-2 py-1.5">
                      <Select
                        label="Who confirms a selection"
                        value={policy.selectionConfirmedBy}
                        disabled={busy}
                        onChange={(e) =>
                          update.mutate({ selectionConfirmedBy: e.target.value as CpiPolicy['selectionConfirmedBy'] })
                        }
                        className="max-w-xs"
                      >
                        <option value="SUPERVISOR">the chosen supervisor</option>
                        <option value="COORDINATOR">the coordinator</option>
                        <option value="EITHER">either of them</option>
                      </Select>
                    </div>
                  )}

                  {group.title === 'Evaluation' && (
                    <div className="px-2 py-1.5">
                      <Select
                        label="Who submits availability"
                        value={policy.availabilityRequiredFrom}
                        disabled={busy}
                        onChange={(e) =>
                          update.mutate({
                            availabilityRequiredFrom: e.target.value as CpiPolicy['availabilityRequiredFrom'],
                          })
                        }
                        className="max-w-xs"
                      >
                        <option value="EVALUATORS_ONLY">evaluators only</option>
                        <option value="EVALUATORS_AND_SUPERVISORS">evaluators and supervisors</option>
                        <option value="NONE">nobody — the coordinator schedules directly</option>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-control bg-canvas-sunken px-3 py-2 text-xs text-ink-muted">
        Who marks and how much their marks count is not set here — it is per stage and per session, under Evaluation. A
        supervisor marking their own group and an external guest both count in full unless you deliberately set their
        seat to advisory.
      </p>
    </Card>
  );
}
