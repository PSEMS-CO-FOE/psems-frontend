import { useCpiPolicy, useUpdateCpiPolicy, type CpiPolicy } from '@/features/policy/usePolicy';
import { getApiErrorMessage } from '@/lib/apiError';

type BoolKey = {
  [K in keyof CpiPolicy]: CpiPolicy[K] extends boolean ? K : never;
}[keyof CpiPolicy];

interface Toggle {
  key: BoolKey;
  label: string;
  // Settings whose machinery has not been built yet are shown but disabled,
  // rather than silently doing nothing when a coordinator flips them.
  pending?: string;
}

const SECTIONS: { title: string; hint: string; toggles: Toggle[] }[] = [
  {
    title: 'Ideas',
    hint: 'Who may post a project idea, and on what terms.',
    toggles: [
      { key: 'allowStudentIdeas', label: 'Students may post ideas' },
      { key: 'studentIdeasLeaderOnly', label: 'Only the group leader posts the group’s idea' },
      { key: 'allowSupervisorIdeas', label: 'Supervisors may post ideas' },
      { key: 'allowCoordinatorIdeas', label: 'The coordinator may post ideas' },
      { key: 'requireStudentIdeaApproval', label: 'Student ideas need approval' },
      { key: 'allowCoSupervisorOnIdea', label: 'An idea may name a co-supervisor', pending: 'co-supervisors' },
    ],
  },
  {
    title: 'Selection',
    hint: 'Expression of interest and who confirms a group’s project.',
    toggles: [
      { key: 'interestEnabled', label: 'Groups and lecturers may express interest' },
      { key: 'studentsSeeOtherGroupIdeas', label: 'Students can see other groups’ ideas' },
      {
        key: 'allowInterestWithdrawal',
        label: 'Interest may be withdrawn while the phase is open',
        pending: 'interest withdrawal',
      },
      { key: 'allowSupervisorSelfRequest', label: 'Lecturers may ask to supervise', pending: 'supervisor requests' },
    ],
  },
  {
    title: 'Participation',
    hint: 'Whether a student may take part without a group.',
    toggles: [
      {
        key: 'allowIndividualParticipation',
        label: 'Students may take part individually',
        pending: 'individual participation',
      },
      { key: 'autoCreateSoloGroup', label: 'Create a solo group automatically', pending: 'individual participation' },
    ],
  },
  {
    title: 'Evaluation',
    hint: 'How evaluations are reviewed and recorded.',
    toggles: [
      { key: 'headJudgeEnabled', label: 'Use a Head Judge (otherwise the coordinator reviews)' },
      { key: 'requireOverallComment', label: 'An overall comment is required with every evaluation' },
    ],
  },
  {
    title: 'Results',
    hint: 'What students eventually receive.',
    toggles: [{ key: 'gradingEnabled', label: 'Award grades as well as marks', pending: 'grading' }],
  },
];

export function CpiPolicyPanel({ cpiId }: { cpiId: string }) {
  const { data: policy, isLoading } = useCpiPolicy(cpiId);
  const update = useUpdateCpiPolicy(cpiId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading course settings…</p>;
  if (!policy) return null;

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-700">Course settings</h3>
      <p className="mt-1 text-xs text-gray-500">
        These decide how this course behaves. They start from the preset chosen at creation and can be changed at any
        point — nothing here is locked in by adding supervisors or by the phase you are in.
      </p>

      {update.isError && <p className="mt-2 text-xs text-red-600">{getApiErrorMessage(update.error)}</p>}

      <div className="mt-3 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-medium text-gray-700">{section.title}</p>
            <p className="text-xs text-gray-400">{section.hint}</p>
            <div className="mt-1 space-y-1 pl-2">
              {section.toggles.map(({ key, label, pending }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 text-xs ${pending ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  <input
                    type="checkbox"
                    checked={policy[key]}
                    disabled={update.isPending || Boolean(pending)}
                    onChange={(e) => update.mutate({ [key]: e.target.checked } as Partial<CpiPolicy>)}
                  />
                  {label}
                  {pending && (
                    <span className="rounded bg-gray-100 px-1 text-[10px] text-gray-500">
                      not active until {pending} ships
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-xs font-medium text-gray-700">Who confirms a selection</p>
          <select
            value={policy.selectionConfirmedBy}
            disabled={update.isPending}
            onChange={(e) =>
              update.mutate({ selectionConfirmedBy: e.target.value as CpiPolicy['selectionConfirmedBy'] })
            }
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="SUPERVISOR">the chosen supervisor</option>
            <option value="COORDINATOR">the coordinator</option>
            <option value="EITHER">either of them</option>
          </select>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-700">
            Who submits availability
            <span className="ml-1 rounded bg-gray-100 px-1 text-[10px] font-normal text-gray-500">
              not active until scheduling ships
            </span>
          </p>
          <select
            value={policy.availabilityRequiredFrom}
            disabled
            className="mt-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-400"
          >
            <option value="EVALUATORS_ONLY">evaluators only</option>
            <option value="EVALUATORS_AND_SUPERVISORS">evaluators and supervisors</option>
            <option value="NONE">nobody — the coordinator schedules directly</option>
          </select>
        </div>
      </div>

      <p className="mt-4 rounded bg-gray-50 px-2 py-2 text-xs text-gray-500">
        Who marks and how much their marks count is not set here — it is per stage and per session, under Evaluation
        config and Evaluation panels. A supervisor marking their own group and an external guest both count in full
        unless you deliberately set their seat to advisory.
      </p>
    </div>
  );
}
