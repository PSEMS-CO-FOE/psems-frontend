import { useState } from 'react';
import {
  useEvaluationConfig,
  useSetEvaluationConfig,
  useAssignStageEvaluator,
  type ConfigInputStage,
} from '@/features/evaluations/useEvaluationConfig';
import { useCpiDetail } from '@/features/courses/useCpiDetail';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

type EditCriterion = { name: string; description: string; weight: number; maxScore: number };
type EditStage = {
  name: string;
  weight: number;
  evaluatorsRequired: number;
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
    evaluatorsRequired: 1,
    submissionRequired: true,
    ...EMPTY_WINDOWS,
    criteria: [
      { name: 'Clarity', description: '', weight: 50, maxScore: 10 },
      { name: 'Feasibility', description: '', weight: 50, maxScore: 10 },
    ],
  },
  {
    name: 'Final',
    weight: 60,
    evaluatorsRequired: 1,
    submissionRequired: false,
    ...EMPTY_WINDOWS,
    criteria: [{ name: 'Implementation', description: '', weight: 100, maxScore: 100 }],
  },
];

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

export function CpiEvaluationConfig({ cpiId }: { cpiId: string }) {
  const { data: saved } = useEvaluationConfig(cpiId);
  const { data: cpi } = useCpiDetail(cpiId);
  const setConfig = useSetEvaluationConfig(cpiId);
  const assignEvaluator = useAssignStageEvaluator(cpiId);

  // The CPI's evaluator pool — stage evaluators must come from here.
  const evaluatorPool = cpi?.evaluators ?? [];

  const [stages, setStages] = useState<EditStage[]>(DEFAULT_STAGES);
  const [evaluatorInputs, setEvaluatorInputs] = useState<Record<string, string>>({});

  const stageWeightSum = sum(stages.map((s) => s.weight));
  const stageWeightsOk = stageWeightSum === 100;
  const criteriaOk = stages.every((s) => sum(s.criteria.map((c) => c.weight)) === 100);
  const canSave = stageWeightsOk && criteriaOk && stages.length > 0;

  const updateStage = (i: number, patch: Partial<EditStage>) =>
    setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateCriterion = (si: number, ci: number, patch: Partial<EditCriterion>) =>
    setStages((prev) =>
      prev.map((s, idx) =>
        idx === si
          ? { ...s, criteria: s.criteria.map((c, cIdx) => (cIdx === ci ? { ...c, ...patch } : c)) }
          : s,
      ),
    );

  const save = () => {
    const payload: ConfigInputStage[] = stages.map((s) => ({
      name: s.name,
      weight: s.weight,
      evaluatorsRequired: s.evaluatorsRequired,
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
      })),
    }));
    setConfig.mutate(payload);
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Evaluation config</h3>

      {setConfig.isError && (
        <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(setConfig.error)}</p>
      )}
      {setConfig.isSuccess && (
        <p className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">Config saved.</p>
      )}

      {/* Builder */}
      <div className="mt-3 space-y-3">
        {stages.map((stage, si) => {
          const critSum = sum(stage.criteria.map((c) => c.weight));
          return (
            <div key={si} className="rounded border border-gray-200 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={stage.name}
                  onChange={(e) => updateStage(si, { name: e.target.value })}
                  placeholder="Stage name"
                  className="rounded border border-gray-300 px-2 py-1 text-xs"
                />
                <label className="text-xs text-gray-500">
                  weight
                  <input
                    type="number"
                    value={stage.weight}
                    onChange={(e) => updateStage(si, { weight: Number(e.target.value) })}
                    className="ml-1 w-14 rounded border border-gray-300 px-1 py-1 text-xs"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  evaluators
                  <input
                    type="number"
                    value={stage.evaluatorsRequired}
                    onChange={(e) => updateStage(si, { evaluatorsRequired: Number(e.target.value) })}
                    className="ml-1 w-12 rounded border border-gray-300 px-1 py-1 text-xs"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={stage.submissionRequired}
                    onChange={(e) => updateStage(si, { submissionRequired: e.target.checked })}
                  />
                  submission
                </label>
                {stages.length > 1 && (
                  <button
                    onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== si))}
                    className="ml-auto text-xs text-red-500 hover:underline"
                  >
                    remove stage
                  </button>
                )}
              </div>

              {/* Optional per-stage scheduling windows */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 pl-3 text-xs text-gray-500">
                <label className="flex flex-col">
                  Submission opens
                  <input
                    type="datetime-local"
                    value={stage.submissionWindowStart}
                    onChange={(e) => updateStage(si, { submissionWindowStart: e.target.value })}
                    className="mt-0.5 rounded border border-gray-300 px-1 py-0.5"
                  />
                </label>
                <label className="flex flex-col">
                  Submission closes
                  <input
                    type="datetime-local"
                    value={stage.submissionWindowEnd}
                    onChange={(e) => updateStage(si, { submissionWindowEnd: e.target.value })}
                    className="mt-0.5 rounded border border-gray-300 px-1 py-0.5"
                  />
                </label>
                <label className="flex flex-col">
                  Scoring opens
                  <input
                    type="datetime-local"
                    value={stage.executionWindowStart}
                    onChange={(e) => updateStage(si, { executionWindowStart: e.target.value })}
                    className="mt-0.5 rounded border border-gray-300 px-1 py-0.5"
                  />
                </label>
                <label className="flex flex-col">
                  Scoring closes
                  <input
                    type="datetime-local"
                    value={stage.executionWindowEnd}
                    onChange={(e) => updateStage(si, { executionWindowEnd: e.target.value })}
                    className="mt-0.5 rounded border border-gray-300 px-1 py-0.5"
                  />
                </label>
                <p className="col-span-2 text-gray-400">
                  Leave blank to use the phase window. Set both ends to give this stage its own time.
                </p>
              </div>

              {/* Criteria */}
              <div className="mt-2 space-y-1 pl-3">
                {stage.criteria.map((c, ci) => (
                  <div key={ci} className="flex flex-wrap items-center gap-1">
                    <input
                      value={c.name}
                      onChange={(e) => updateCriterion(si, ci, { name: e.target.value })}
                      placeholder="criterion"
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                    />
                    <label className="text-xs text-gray-400">
                      w
                      <input
                        type="number"
                        value={c.weight}
                        onChange={(e) => updateCriterion(si, ci, { weight: Number(e.target.value) })}
                        className="ml-1 w-12 rounded border border-gray-300 px-1 py-0.5 text-xs"
                      />
                    </label>
                    <label className="text-xs text-gray-400">
                      max
                      <input
                        type="number"
                        value={c.maxScore}
                        onChange={(e) => updateCriterion(si, ci, { maxScore: Number(e.target.value) })}
                        className="ml-1 w-14 rounded border border-gray-300 px-1 py-0.5 text-xs"
                      />
                    </label>
                    {stage.criteria.length > 1 && (
                      <button
                        onClick={() =>
                          updateStage(si, { criteria: stage.criteria.filter((_, idx) => idx !== ci) })
                        }
                        className="text-xs text-red-400 hover:underline"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateStage(si, {
                        criteria: [...stage.criteria, { name: '', description: '', weight: 0, maxScore: 10 }],
                      })
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + criterion
                  </button>
                  <span className={`text-xs ${critSum === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    criteria sum: {critSum}/100
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() =>
            setStages((prev) => [
              ...prev,
              { name: '', weight: 0, evaluatorsRequired: 1, submissionRequired: false, ...EMPTY_WINDOWS, criteria: [{ name: '', description: '', weight: 100, maxScore: 10 }] },
            ])
          }
          className="text-xs text-blue-600 hover:underline"
        >
          + stage
        </button>
        <span className={`text-xs ${stageWeightsOk ? 'text-green-600' : 'text-red-600'}`}>
          stage weights sum: {stageWeightSum}/100
        </span>
        <button
          onClick={save}
          disabled={!canSave || setConfig.isPending}
          className="ml-auto rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {setConfig.isPending ? '…' : 'Save config'}
        </button>
      </div>

      {/* Saved config + stage-evaluator assignment */}
      {saved && saved.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs font-medium text-gray-600">Saved rubric</p>
          <ul className="mt-2 space-y-2">
            {saved.map((stage) => (
              <li key={stage.id} className="text-xs">
                <p className="font-medium text-gray-800">
                  {stage.name} (weight {stage.weight}
                  {stage.submissionRequired && ', submission required'})
                </p>
                <p className="text-gray-400">
                  criteria: {stage.criteria.map((c) => `${c.name} ${c.weight}%/${c.maxScore}`).join(', ')}
                </p>
                <p className="text-gray-400">
                  evaluators:{' '}
                  {stage.evaluators.length
                    ? stage.evaluators.map((e) => personName(e.cpiEvaluator.lecturer.user)).join(', ')
                    : 'none'}
                </p>
                <div className="mt-1 flex gap-1">
                  <select
                    value={evaluatorInputs[stage.id] ?? ''}
                    onChange={(e) => setEvaluatorInputs((p) => ({ ...p, [stage.id]: e.target.value }))}
                    className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                  >
                    <option value="">Select evaluator…</option>
                    {evaluatorPool.map((ev) => (
                      <option key={ev.id} value={ev.lecturer.user.id}>
                        {personName(ev.lecturer.user)}
                        {ev.isHeadJudge ? ' (Head Judge)' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      assignEvaluator.mutate(
                        { stageId: stage.id, lecturerUserId: evaluatorInputs[stage.id] ?? '' },
                        { onSuccess: () => setEvaluatorInputs((p) => ({ ...p, [stage.id]: '' })) },
                      )
                    }
                    disabled={!evaluatorInputs[stage.id] || assignEvaluator.isPending}
                    className="rounded bg-gray-700 px-2 py-0.5 text-white hover:bg-gray-600 disabled:opacity-50"
                  >
                    assign
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {assignEvaluator.isError && (
            <p className="mt-1 text-xs text-red-600">{getApiErrorMessage(assignEvaluator.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
