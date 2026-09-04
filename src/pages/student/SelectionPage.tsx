import { Link, useParams } from 'react-router-dom';
import { useIdeas, type Idea } from '@/features/ideas/useIdeas';
import type { InterestExpression } from '@/features/selection/useSelection';
import {
  useSelectionState,
  useSelectProject,
  useExpressInterest,
  useSeekingSupervisor,
  useWithdrawInterest,
} from '@/features/selection/useSelection';
import { getApiErrorMessage } from '@/lib/apiError';
import { ideaAuthorLabel, selectionStatusLabel } from '@/lib/labels';
import { personName, shortName } from '@/lib/name';
import { Avatar, Badge, Button, Card, Disclosure, EmptyState, Notice } from '@/components/ui';
import { PolicyNote } from '@/components/PolicyNote';

/**
 * One project, foldable, offering only what that idea allows.
 *
 * Every idea is awarded by whoever posted it: a group registers interest, and
 * the supervisor or coordinator picks from everyone interested. So a group
 * never "selects" someone else's idea — there is nothing for them to select.
 *
 * Their own idea is the exception, and it is not a selection either: the idea is
 * already theirs, and what is being chosen is which of the supervisors who
 * offered will take it on.
 */
function IdeaChoice({
  idea,
  isOurs,
  interestState,
  willing,
  onInterest,
  onSeekSupervisor,
  onChooseSupervisor,
  busy,
}: {
  idea: Idea;
  isOurs: boolean;
  interestState: 'GROUP_INTEREST' | 'SEEKING_SUPERVISOR' | null;
  willing: InterestExpression[];
  onInterest: () => void;
  onSeekSupervisor: () => void;
  onChooseSupervisor: (supervisorUserId: string) => void;
  busy: boolean;
}) {
  return (
    <Disclosure
      summary={idea.title}
      meta={
        <span className="flex flex-wrap items-center gap-1.5">
          {isOurs ? (
            <Badge tone="info">Your group&rsquo;s idea</Badge>
          ) : (
            <Badge tone="neutral">{ideaAuthorLabel(idea.authorType)}</Badge>
          )}
          {interestState === 'GROUP_INTEREST' && <Badge tone="brand">Interest registered</Badge>}
          {isOurs && willing.length === 0 && <Badge tone="caution">No supervisor yet</Badge>}
          {willing.length > 0 && (
            <Badge tone="positive">
              {willing.length} supervisor{willing.length === 1 ? '' : 's'} offered
            </Badge>
          )}
        </span>
      }
    >
      <p className="whitespace-pre-wrap text-sm text-ink-muted">{idea.description}</p>
      <p className="mt-2 text-xs text-ink-subtle">By {personName(idea.author)}</p>

      {/* Someone else's idea: interest is the whole of the group's part. The
          supervisor or coordinator who posted it picks from everyone who asked. */}
      {!isOurs && (
        <div className="mt-3 border-t border-line pt-3">
          {interestState === 'GROUP_INTEREST' ? (
            <p className="text-xs text-ink-muted">
              Your interest is registered. Whoever posted this picks from the groups who asked —
              there is nothing further for you to do here.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" onClick={onInterest} disabled={busy}>
                Register interest
              </Button>
              <span className="text-xs text-ink-subtle">
                You may register interest in more than one.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Their own idea: every supervisor who offered, named, so the group can
          see who they would be working with before choosing. */}
      {isOurs && (
        <div className="mt-3 border-t border-line pt-3">
          {willing.length === 0 ? (
            <p className="text-xs text-ink-muted">
              {interestState === 'SEEKING_SUPERVISOR'
                ? 'Supervisors can see this idea and can offer to take it on. Nobody has offered yet.'
                : 'This idea is not being shown to supervisors yet.'}
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-ink">
                {willing.length === 1
                  ? 'One supervisor has offered to take this on'
                  : `${willing.length} supervisors have offered — choose one`}
              </p>
              <ul className="mt-2 space-y-1.5">
                {willing.map((w) => (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2"
                  >
                    <Avatar name={personName(w.supervisor!.user)} role="LECTURER" size="sm" />
                    <span className="text-sm text-ink" title={personName(w.supervisor!.user)}>
                      {shortName(personName(w.supervisor!.user))}
                    </span>
                    <Link
                      to={`/profile/${w.supervisor!.user.id}`}
                      className="text-xs text-brand-700 underline-offset-2 hover:underline"
                    >
                      View profile
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      className="ml-auto"
                      onClick={() => onChooseSupervisor(w.supervisor!.user.id)}
                      disabled={busy}
                    >
                      Go with {shortName(personName(w.supervisor!.user))}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Posting normally starts the search by itself. It does not when the
              idea still needs approval, or when interest was switched off. */}
          {interestState !== 'SEEKING_SUPERVISOR' && (
            <Button variant="secondary" size="sm" className="mt-2" onClick={onSeekSupervisor} disabled={busy}>
              Show this to supervisors
            </Button>
          )}
        </div>
      )}
    </Disclosure>
  );
}

export function SelectionPage() {
  const { cpiId = '' } = useParams();
  const { data: state, isLoading, isError, error } = useSelectionState(cpiId);
  const { data: ideas } = useIdeas(cpiId);

  const select = useSelectProject(cpiId);
  const interest = useExpressInterest(cpiId);
  const seeking = useSeekingSupervisor(cpiId);
  const withdraw = useWithdrawInterest(cpiId);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading selection…</p>;
  if (isError || !state) {
    return (
      <Notice tone="critical">
        {getApiErrorMessage(error, 'Could not load selection')}
      </Notice>
    );
  }
  if (state.role !== 'STUDENT') {
    return <p className="text-sm text-ink-muted">Selection view is for students here.</p>;
  }

  const ideaOptions = ideas ?? [];

  // Which ideas are the group's own, and what the group already did about each.
  const ourIdeaIds = new Set(
    state.groupInterest.filter((e) => e.type === 'SEEKING_SUPERVISOR').map((e) => e.idea.id),
  );
  for (const idea of ideaOptions) {
    if (idea.authorType === 'STUDENT' && idea.groupId) ourIdeaIds.add(idea.id);
  }

  // A course may open every group's ideas for reading, but another group's idea
  // is never one this group can act on — so it does not belong in the picker.
  const choosable = ideaOptions.filter(
    (idea) => idea.authorType !== 'STUDENT' || ourIdeaIds.has(idea.id),
  );

  const interestByIdea = new Map<string, 'GROUP_INTEREST' | 'SEEKING_SUPERVISOR'>(
    state.groupInterest
      .filter((e) => !e.withdrawnAt)
      .flatMap((e) =>
        e.type === 'GROUP_INTEREST' || e.type === 'SEEKING_SUPERVISOR'
          ? [[e.idea.id, e.type] as const]
          : [],
      ),
  );

  const CONFIRMER = {
    SUPERVISOR: 'the supervisor you choose',
    COORDINATOR: 'the coordinator',
    EITHER: 'either the coordinator or the supervisor you choose',
  };

  return (
    <div className="space-y-4">
      <PolicyNote
        cpiId={cpiId}
        lines={(p) => [
          p.interestEnabled
            ? 'Express interest first — a project is not yours until it is confirmed.'
            : 'Interest is not used here; a project is assigned directly.',
          `A selection is confirmed by ${CONFIRMER[p.selectionConfirmedBy]}.`,
          p.interestEnabled &&
            (p.allowInterestWithdrawal
              ? 'You may withdraw interest while this phase is open.'
              : 'Interest cannot be withdrawn once you express it.'),
          p.maxInterestsPerGroup !== null &&
            `Your group may express at most ${p.maxInterestsPerGroup} interest(s).`,
        ]}
      />
      {/* Current selection */}
      <Card>
        <h2 className="text-sm font-semibold text-ink">Your group's selection</h2>
        {state.selection ? (
          <p className="mt-2 text-sm text-ink">
            {state.selection.idea.title} —{' '}
            <span className="font-medium">{selectionStatusLabel(state.selection.status)}</span>
            {state.selection.supervisor && ` · ${state.selection.supervisor.user.email}`}
          </p>
        ) : (
          <EmptyState density="compact" title="No project selected yet" hint="Register interest in a supervisor’s idea, or post your own, while the selection phase is open." />
        )}
      </Card>

      {/* One card per project, not a dropdown over all of them. Each idea
          allows different things — you cannot register interest in your own
          group's idea, and its supervisor search already started by itself —
          so the actions belong on the idea rather than under a shared picker. */}
      {!state.selection && (
        <Card
          title="Choose a project"
          description="Open a project to read it. Registering interest signals to its supervisor; selecting is the formal step and needs confirming before it is yours."
        >
          {choosable.length === 0 && (
            <EmptyState
              density="compact"
              title="No projects to choose from yet"
              hint="Supervisors post ideas during the idea phase. Your group can also post its own, which starts looking for a supervisor straight away."
            />
          )}

          <div className="space-y-2">
            {choosable.map((idea) => (
              <IdeaChoice
                key={idea.id}
                idea={idea}
                isOurs={ourIdeaIds.has(idea.id)}
                interestState={interestByIdea.get(idea.id) ?? null}
                willing={state.willingSupervisors.filter((w) => w.idea.id === idea.id && w.supervisor)}
                onInterest={() => interest.mutate(idea.id)}
                onSeekSupervisor={() => seeking.mutate(idea.id)}
                onChooseSupervisor={(supervisorUserId) =>
                  select.mutate({ ideaId: idea.id, supervisorUserId })
                }
                busy={interest.isPending || select.isPending || seeking.isPending}
              />
            ))}
          </div>

          {(select.isError || interest.isError || seeking.isError) && (
            <Notice tone="critical" size="xs" className="mt-3">
              {getApiErrorMessage(select.error || interest.error || seeking.error)}
            </Notice>
          )}
        </Card>
      )}

      {/* Interest already registered. Shown even after a selection exists, since
          it is a record of what the group did. */}
      {state.groupInterest.filter((e) => !e.withdrawnAt).length > 0 && (
        <Card title="Interest your group registered">
          <ul className="space-y-2">
            {state.groupInterest
              .filter((e) => !e.withdrawnAt)
              .map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-canvas-sunken px-3 py-2 text-xs"
                >
                  <span className="text-ink-muted">
                    {e.type === 'SEEKING_SUPERVISOR' ? 'Seeking a supervisor for' : 'Interested in'}
                  </span>
                  <span className="font-medium text-ink">{e.idea.title}</span>
                  {/* Withdrawing frees a slot against the course's interest cap. */}
                  {!state.selection && (
                    <Button
                      variant="danger-quiet"
                      size="sm"
                      className="ml-auto"
                      onClick={() => withdraw.mutate({ ideaId: e.idea.id, type: e.type })}
                      disabled={withdraw.isPending}
                    >
                      Withdraw
                    </Button>
                  )}
                </li>
              ))}
          </ul>
          {withdraw.isError && (
            <Notice tone="critical" size="xs" className="mt-2">
              {getApiErrorMessage(withdraw.error)}
            </Notice>
          )}
        </Card>
      )}

    </div>
  );
}
