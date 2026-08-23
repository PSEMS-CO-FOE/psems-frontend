import { useState } from 'react';
import {
  useEvaluationConfig,
  usePatchStage,
  usePooledShareDecisions,
  useSetPanelRules,
  useSetPooledShare,
  useSetTimerSegments,
  type SavedStage,
} from '@/features/evaluations/useEvaluationConfig';
import { useSetStageWeights } from '@/features/marks/useMarks';
import { PANEL_ROLES, roleLabel, type MarkCounting, type PanelRole } from '@/features/panel/usePanel';
import { personName } from '@/lib/name';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, EmptyState, ErrorText, Notice } from '@/components/ui';

type PanelScoreVisibility = SavedStage['panelScoreVisibility'];

interface RuleDraft {
  role: PanelRole;
  minRequired: string;
  maxAllowed: string;
  weightPercent: string;
  markCounting: MarkCounting;
  openToAll: boolean;
}

interface SegmentDraft {
  name: string;
  minutes: string;
  seconds: string;
}

const toRuleDrafts = (stage: SavedStage): RuleDraft[] =>
  stage.panelRules.map((r) => ({
    role: r.role,
    minRequired: String(r.minRequired),
    maxAllowed: r.maxAllowed == null ? '' : String(r.maxAllowed),
    weightPercent: r.weightPercent == null ? '' : String(r.weightPercent),
    markCounting: r.markCounting,
    openToAll: r.openToAll,
  }));

const toSegmentDrafts = (stage: SavedStage): SegmentDraft[] =>
  stage.timerSegments.map((seg) => ({
    name: seg.name,
    minutes: String(Math.floor(seg.targetSeconds / 60)),
    seconds: String(seg.targetSeconds % 60),
  }));

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line px-4 py-3 first:border-t-0">
      <p className="text-xs font-medium text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Setting the pooled share is the only way walk-in and guest marks ever reach a
// total: aggregation reads `pooledSharePercent ?? 0`, so until a coordinator
// decides, every one of those marks counts for nothing.
function PooledShare({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const setShare = useSetPooledShare(cpiId);
  const { data: decisions } = usePooledShareDecisions(cpiId, stage.id);

  const [share, setShare_] = useState(stage.pooledSharePercent == null ? '' : String(stage.pooledSharePercent));
  const [limit, setLimit] = useState(stage.pooledScorerLimit == null ? '' : String(stage.pooledScorerLimit));
  const [reason, setReason] = useState('');

  const pooledRoles = stage.panelRules.filter((r) => r.markCounting === 'COORDINATOR_DECIDES');
  const unset = stage.pooledSharePercent == null;

  const save = () =>
    setShare.mutate(
      {
        stageId: stage.id,
        sharePercent: Number(share),
        scorerLimit: num(limit),
        reason: reason.trim(),
      },
      { onSuccess: () => setReason('') },
    );

  return (
    <Section
      title="Pooled marks"
      hint="Walk-ins and guests without a formal seat are averaged into one contribution, weighted by this share, so a crowd cannot outvote the panel by number."
    >
      {unset ? (
        <Notice tone="caution" className="mb-2">
          No share set, so pooled marks currently count for <strong>nothing</strong>. They are still recorded and
          visible — they just do not reach the total until you decide a share.
        </Notice>
      ) : (
        <p className="mb-2 text-xs text-ink-muted">
          Pooled marks are worth <strong>{stage.pooledSharePercent}%</strong>
          {stage.pooledScorerLimit != null && <> · first {stage.pooledScorerLimit} scorers count</>}.
        </p>
      )}

      {pooledRoles.length === 0 && (
        <p className="mb-2 text-xs text-ink-subtle">
          No role on this stage is set to <em>pooled, coordinator weights</em> yet, so nothing is pooled. Set one in
          Panel composition below, or seat a guest as pooled.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-ink-muted">
          Share
          <span className="mt-0.5 flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={share}
              onChange={(e) => setShare_(e.target.value)}
              className="w-20 rounded-control border border-line-strong px-2 py-1 text-sm"
            />
            <span className="text-sm text-ink-muted">%</span>
          </span>
        </label>
        <label className="text-xs text-ink-muted">
          Scorers counted
          <input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="all"
            className="mt-0.5 block w-24 rounded-control border border-line-strong px-2 py-1 text-sm"
          />
        </label>
        <label className="min-w-56 flex-1 text-xs text-ink-muted">
          Reason <span className="text-critical-700">*</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="why this share, decided now"
            className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-sm"
          />
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={save}
          disabled={share.trim() === '' || !reason.trim() || setShare.isPending}
        >
          {setShare.isPending ? '…' : 'Set share'}
        </Button>
      </div>
      <p className="mt-1 text-xs text-ink-subtle">
        The reason is required because this is decided with the marks already visible. Every decision is kept.
      </p>
      {setShare.isError && <ErrorText className="mt-1">{getApiErrorMessage(setShare.error)}</ErrorText>}

      {decisions && decisions.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {decisions.map((d) => (
            <li key={d.id} className="text-xs text-ink-subtle">
              {d.sharePercent}%{d.scorerLimit != null && ` · ${d.scorerLimit} scorers`} ·{' '}
              {new Date(d.decidedAt).toLocaleString()} · {personName(d.decidedBy)} — {d.reason}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function PanelComposition({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const setRules = useSetPanelRules(cpiId);
  const [rules, setRules_] = useState<RuleDraft[]>(() => toRuleDrafts(stage));

  const update = (i: number, patch: Partial<RuleDraft>) =>
    setRules_((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = () =>
    setRules.mutate({
      stageId: stage.id,
      rules: rules.map((r) => ({
        role: r.role,
        minRequired: Number(r.minRequired) || 0,
        maxAllowed: num(r.maxAllowed),
        weightPercent: num(r.weightPercent),
        markCounting: r.markCounting,
        openToAll: r.openToAll,
      })),
    });

  return (
    <Section
      title="Panel composition"
      hint="How many of each role a session expects, what their marks are worth, and whether anyone may join. Reported as readiness, never enforced — closing short is allowed and logged."
    >
      <div className="space-y-1.5">
        {rules.map((rule, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <select
              value={rule.role}
              onChange={(e) => update(i, { role: e.target.value as PanelRole })}
              className="rounded-control border border-line-strong px-1.5 py-1 text-xs"
            >
              {PANEL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            <label className="text-xs text-ink-muted">
              min
              <input
                type="number"
                min={0}
                value={rule.minRequired}
                onChange={(e) => update(i, { minRequired: e.target.value })}
                className="ml-1 w-12 rounded-control border border-line-strong px-1 py-1 text-xs"
              />
            </label>
            <label className="text-xs text-ink-muted">
              max
              <input
                type="number"
                min={1}
                value={rule.maxAllowed}
                onChange={(e) => update(i, { maxAllowed: e.target.value })}
                placeholder="any"
                className="ml-1 w-14 rounded-control border border-line-strong px-1 py-1 text-xs"
              />
            </label>
            <label className="text-xs text-ink-muted" title="Overrides the role's default weight for every seat holding it.">
              weight
              <input
                type="number"
                min={0}
                max={100}
                value={rule.weightPercent}
                onChange={(e) => update(i, { weightPercent: e.target.value })}
                placeholder="even"
                className="ml-1 w-16 rounded-control border border-line-strong px-1 py-1 text-xs"
              />
            </label>
            <select
              value={rule.markCounting}
              onChange={(e) => update(i, { markCounting: e.target.value as MarkCounting })}
              className="rounded-control border border-line-strong px-1.5 py-1 text-xs"
            >
              <option value="COUNTED">marks count</option>
              <option value="ADVISORY">advisory only</option>
              <option value="COORDINATOR_DECIDES">pooled, coordinator weights</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={rule.openToAll}
                onChange={(e) => update(i, { openToAll: e.target.checked })}
              />
              anyone may join
            </label>
            <button
              onClick={() => setRules_((prev) => prev.filter((_, idx) => idx !== i))}
              className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60"
            >
              remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="neutral"
          size="sm"
          onClick={() =>
            setRules_((prev) => [
              ...prev,
              { role: 'EVALUATOR', minRequired: '1', maxAllowed: '', weightPercent: '', markCounting: 'COUNTED', openToAll: false },
            ])
          }
        >
          Add a role
        </Button>
        <Button variant="primary" size="sm" onClick={save} disabled={setRules.isPending}>
          {setRules.isPending ? '…' : 'Save composition'}
        </Button>
        {setRules.isSuccess && <span className="text-xs text-positive-700">Saved.</span>}
      </div>
      {setRules.isError && <ErrorText className="mt-1">{getApiErrorMessage(setRules.error)}</ErrorText>}
    </Section>
  );
}

function StageSettings({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const patch = usePatchStage(cpiId);
  const [name, setName] = useState(stage.name);
  const [visibility, setVisibility] = useState<PanelScoreVisibility>(stage.panelScoreVisibility);

  return (
    <Section title="Stage settings" hint="Rename the stage, or change who sees whose marks while it is being scored.">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-ink-muted">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-0.5 block w-56 rounded-control border border-line-strong px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Score visibility
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as PanelScoreVisibility)}
            className="mt-0.5 block rounded-control border border-line-strong px-2 py-1 text-sm"
          >
            <option value="ISOLATED">isolated — nobody sees another's marks</option>
            <option value="OPEN_WITH_NAMES">open, with names</option>
            <option value="OPEN_ANONYMOUS">open, anonymous</option>
          </select>
        </label>
        <Button
          variant="primary"
          size="sm"
          onClick={() => patch.mutate({ stageId: stage.id, changes: { name: name.trim(), panelScoreVisibility: visibility } })}
          disabled={!name.trim() || patch.isPending}
        >
          {patch.isPending ? '…' : 'Save stage'}
        </Button>
        {patch.isSuccess && <span className="text-xs text-positive-700">Saved.</span>}
      </div>
      {visibility !== 'ISOLATED' && (
        <Notice tone="caution" className="mt-2">
          Opening a stage lets panelists see each other's marks while scoring. Isolation is the default for a reason —
          use this only where an open panel is the point, such as a competition judged in the room.
        </Notice>
      )}
      {patch.isError && <ErrorText className="mt-1">{getApiErrorMessage(patch.error)}</ErrorText>}
    </Section>
  );
}

function TimerSegments({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const setSegments = useSetTimerSegments(cpiId);
  const [segments, setSegments_] = useState<SegmentDraft[]>(() => toSegmentDrafts(stage));

  const update = (i: number, patch: Partial<SegmentDraft>) =>
    setSegments_((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const save = () =>
    setSegments.mutate({
      stageId: stage.id,
      segments: segments
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name.trim(),
          targetSeconds: (Number(s.minutes) || 0) * 60 + (Number(s.seconds) || 0),
        })),
    });

  return (
    <Section
      title="Presentation segments"
      hint="The parts of a presentation and how long each should take. Editing these never rewrites a session that has already run — segments are copied onto a session the first time its timer starts."
    >
      {segments.length === 0 && (
        <p className="mb-2 text-xs text-ink-subtle">No segments — the timer runs as one clock.</p>
      )}
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <input
              value={seg.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="e.g. Demo"
              className="w-44 rounded-control border border-line-strong px-2 py-1 text-xs"
            />
            <label className="text-xs text-ink-muted">
              min
              <input
                type="number"
                min={0}
                value={seg.minutes}
                onChange={(e) => update(i, { minutes: e.target.value })}
                className="ml-1 w-14 rounded-control border border-line-strong px-1 py-1 text-xs"
              />
            </label>
            <label className="text-xs text-ink-muted">
              sec
              <input
                type="number"
                min={0}
                max={59}
                value={seg.seconds}
                onChange={(e) => update(i, { seconds: e.target.value })}
                className="ml-1 w-14 rounded-control border border-line-strong px-1 py-1 text-xs"
              />
            </label>
            <button
              onClick={() => setSegments_((prev) => prev.filter((_, idx) => idx !== i))}
              className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60"
            >
              remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          variant="neutral"
          size="sm"
          onClick={() => setSegments_((prev) => [...prev, { name: '', minutes: '5', seconds: '0' }])}
        >
          Add a segment
        </Button>
        <Button variant="primary" size="sm" onClick={save} disabled={setSegments.isPending}>
          {setSegments.isPending ? '…' : 'Save segments'}
        </Button>
        {setSegments.isSuccess && <span className="text-xs text-positive-700">Saved.</span>}
      </div>
      {setSegments.isError && <ErrorText className="mt-1">{getApiErrorMessage(setSegments.error)}</ErrorText>}
    </Section>
  );
}

function StageBlock({ cpiId, stage }: { cpiId: string; stage: SavedStage }) {
  const [open, setOpen] = useState(false);
  const pooled = stage.panelRules.some((r) => r.markCounting === 'COORDINATOR_DECIDES');

  return (
    <div className="rounded-control border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-2 px-4 py-2.5 text-left hover:bg-brand-50"
      >
        <span className="text-sm font-medium text-ink">{stage.name}</span>
        {pooled && stage.pooledSharePercent == null && <Badge tone="caution">pooled marks count for nothing</Badge>}
        {stage.panelScoreVisibility !== 'ISOLATED' && <Badge tone="info">open panel</Badge>}
        {stage.panelRules.some((r) => r.openToAll) && <Badge tone="brand">open to join</Badge>}
        <span className="ml-auto text-xs text-ink-subtle" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t border-line">
          <PooledShare cpiId={cpiId} stage={stage} />
          <PanelComposition cpiId={cpiId} stage={stage} />
          <StageSettings cpiId={cpiId} stage={stage} />
          <TimerSegments cpiId={cpiId} stage={stage} />
        </div>
      )}
    </div>
  );
}

/**
 * Everything about a stage that has to stay changeable once the course is
 * running. The replace-all config above refuses to save as soon as any
 * submission exists — deliberately, since it would rewrite rubrics people have
 * already been marked against — so these targeted endpoints exist to let a
 * coordinator restaff a panel, retime a presentation or weight the walk-in
 * marks on the day itself.
 */
// The credit split. Locked out of the rubric editor once submissions exist,
// which matters when one course spans two semesters: the first semester's
// upload would otherwise freeze the split for the rest of the module.
function StageWeights({ cpiId, stages }: { cpiId: string; stages: SavedStage[] }) {
  const save = useSetStageWeights(cpiId);
  const [draft, setDraft] = useState<Record<string, number> | null>(null);

  const weights = draft ?? Object.fromEntries(stages.map((s) => [s.id, s.weight]));
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="rounded-control border border-line p-3">
      <p className="text-xs font-medium text-ink">Credit split</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        What each stage is worth. Changeable until marks are aggregated — after that it would rewrite
        marks students have already seen.
      </p>

      <div className="mt-2 space-y-1">
        {stages.map((stage) => (
          <div key={stage.id} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-40 truncate text-ink">{stage.name}</span>
            <input
              type="number"
              min={1}
              max={100}
              value={weights[stage.id]}
              onChange={(e) => setDraft({ ...weights, [stage.id]: Number(e.target.value) })}
              className="w-20 rounded-control border border-line-strong px-2 py-1"
            />
            <span className="text-ink-muted">%</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`text-xs ${total === 100 ? 'text-ink-muted' : 'text-critical-700'}`}>
          Total {total}%
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            save.mutate(
              stages.map((stage) => ({ stageId: stage.id, weight: weights[stage.id] })),
              { onSuccess: () => setDraft(null) },
            )
          }
          disabled={!draft || total !== 100 || save.isPending}
        >
          {save.isPending ? '…' : 'Save split'}
        </Button>
      </div>

      {save.isError && <Notice tone="critical">{getApiErrorMessage(save.error)}</Notice>}
    </div>
  );
}

export function StageLiveSettings({ cpiId }: { cpiId: string }) {
  const { data: stages } = useEvaluationConfig(cpiId);

  // Not null on an empty course: silence read as a broken screen.
  if (!stages || stages.length === 0) {
    return (
      <EmptyState
        title="No stages to settle yet"
        hint="Save the rubric first. These settings act on stages that already exist, which is what lets them keep working after marking starts."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <StageWeights cpiId={cpiId} stages={stages} />
      {stages.map((stage) => (
        <StageBlock key={stage.id} cpiId={cpiId} stage={stage} />
      ))}
    </div>
  );
}
