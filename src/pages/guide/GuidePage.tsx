import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { guideSections } from './guideContent';
import { markingIntro, markingPoints } from './markingExplainer';
import { guideActionGroups } from './guideActions';
import { Badge, Card, Disclosure, Segmented } from '@/components/ui';
import { useSetShellTitle } from '@/components/layout/shellTitle';
import crest from '@/assets/crest.png';
import type { Role } from '@/types/auth';

/**
 * One guide per role, opening on the reader's own. Laid out as a document —
 * this is the one page in PSEMS read top to bottom.
 */
export function GuidePage() {
  const role = useAuthStore((s) => s.user?.role);
  const [shown, setShown] = useState<Role>(role ?? 'STUDENT');
  useSetShellTitle('How to use PSEMS');

  const section = guideSections.find((s) => s.role === shown) ?? guideSections[0];

  return (
    <div className="space-y-10">
      <GuideHero
        role={role}
        shown={shown}
        onChange={setShown}
        summary={section.summary}
        stepCount={section.steps.length}
      />

      <section aria-labelledby="guide-steps" className="space-y-5">
        <GuideSectionTitle
          id="guide-steps"
          eyebrow={section.label}
          title="What you do, in order"
          hint={`${section.steps.length} steps`}
        />

        {/* A spine with a node per step; the order is the point. */}
        <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[1.0625rem] before:top-8 before:w-px before:bg-gradient-to-b before:from-brand-200 before:via-line before:to-transparent">
          {section.steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 sm:gap-5">
              <span
                aria-hidden="true"
                className="relative z-10 mt-1 flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-brand ring-4 ring-canvas"
              >
                {index + 1}
              </span>

              <Card className="min-w-0 flex-1 transition-all duration-base ease-standard hover:border-brand-200 hover:shadow-raised">
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 max-w-prose text-sm leading-7 text-ink-muted">{step.body}</p>
                {step.screenshot && (
                  <figure className="mt-4 overflow-hidden rounded-control border border-line bg-canvas-sunken">
                    <img
                      src={`/guide/${step.screenshot}`}
                      alt={`Screenshot: ${step.title}`}
                      className="w-full"
                      loading="lazy"
                    />
                  </figure>
                )}
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <GuideActions shown={shown} />

      {/* Shown to every role rather than only the coordinator: a student who
          cannot see how their number was reached has no way to question it. */}
      <section aria-labelledby="guide-marking" className="space-y-5">
        <GuideSectionTitle
          id="guide-marking"
          eyebrow="Everyone"
          title="How marking works"
          hint={`${markingPoints.length} rules`}
        />

        <Card accent className="bg-brand-wash">
          <p className="max-w-prose text-sm leading-7 text-ink">{markingIntro}</p>
        </Card>

        {/* Two columns: ten dense paragraphs in one stack is a wall. */}
        <div className="grid gap-4 lg:grid-cols-2">
          {markingPoints.map((point, index) => (
            <Card
              key={point.heading}
              className="h-full transition-all duration-base ease-standard hover:border-brand-200 hover:shadow-raised"
            >
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[11px] font-semibold tabular-nums text-brand-700"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-semibold tracking-tight text-ink">{point.heading}</h3>
              </div>
              <p className="mt-2 pl-[1.6rem] text-sm leading-7 text-ink-muted">{point.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="guide-help">
        <Card className="overflow-hidden bg-brand-gradient text-white shadow-brand-lg">
          <div className="relative flex flex-wrap items-start gap-5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10"
            />
            <span
              aria-hidden="true"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-white/15 ring-1 ring-inset ring-white/25"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.1 9a3 3 0 1 1 4.5 2.6c-.9.5-1.6 1.3-1.6 2.4M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
              </svg>
            </span>
            <div className="relative min-w-0 flex-1">
              <h2 id="guide-help" className="text-base font-semibold tracking-tight text-white">
                Still stuck?
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-7 text-white/85">
                Ask your course coordinator first — they can see the state of your course and fix
                most things themselves. Account problems, such as being locked out or suspended, go
                to the system administrator instead.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

/** A reference, filtered to the role being read and folded by default. */
function GuideActions({ shown }: { shown: Role }) {
  const groups = guideActionGroups
    .map((g) => ({ ...g, actions: g.actions.filter((a) => a.roles.includes(shown)) }))
    .filter((g) => g.actions.length > 0);

  if (groups.length === 0) return null;

  const total = groups.reduce((n, g) => n + g.actions.length, 0);

  return (
    <section aria-labelledby="guide-actions" className="space-y-5">
      <GuideSectionTitle
        id="guide-actions"
        eyebrow="Reference"
        title="What each button does"
        hint={`${total} ${total === 1 ? 'action' : 'actions'}`}
      />

      <div className="space-y-2.5">
        {groups.map((group) => (
          <Disclosure
            key={group.title}
            summary={group.title}
            meta={<Badge tone="neutral">{group.actions.length}</Badge>}
          >
            <ul className="divide-y divide-line">
              {group.actions.map((action) => (
                <li key={action.label} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rounded-control bg-canvas-sunken px-2 py-0.5 text-sm font-semibold text-ink">
                      {action.label}
                    </span>
                    <span className="text-xs text-ink-subtle">{action.where}</span>
                  </div>
                  <p className="mt-2 max-w-prose text-sm leading-7 text-ink-muted">{action.does}</p>
                  <p className="mt-1.5 max-w-prose text-xs leading-6 text-ink-subtle">
                    <span className="font-semibold text-ink-muted">Can it be undone? </span>
                    {action.undoable}
                  </p>
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
      </div>
    </section>
  );
}

function GuideHero({
  role,
  shown,
  onChange,
  summary,
  stepCount,
}: {
  role: Role | undefined;
  shown: Role;
  onChange: (role: Role) => void;
  summary: string;
  stepCount: number;
}) {
  return (
    <header className="overflow-hidden rounded-card border border-line bg-surface shadow-raised">
      <div className="relative bg-brand-gradient px-6 py-8 text-white sm:px-9 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 motion-safe:animate-drift">
          <span className="absolute -right-20 -top-28 block h-80 w-80 rounded-full border border-white/10" />
          <span className="absolute -bottom-40 -left-24 block h-96 w-96 rounded-full bg-white/[0.05]" />
        </div>

        <div className="relative flex items-center gap-3">
          <img
            src={crest}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg bg-white/95 object-contain p-1 shadow-card"
          />
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-white/70">
            PSEMS handbook
          </p>
        </div>

        <h1 className="relative mt-5 max-w-2xl text-display font-semibold text-white">
          How to use PSEMS
        </h1>
        <p className="relative mt-3 max-w-xl text-sm leading-7 text-white/80">
          What each role does, in the order they do it — and exactly how a mark is arrived at.
        </p>
      </div>

      {/* On the fold, so it reads as the control for everything below. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line px-6 py-5 sm:px-9">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Reading as
          </p>
          <div className="mt-2">
            <Segmented
              label="Guide for role"
              value={shown}
              onChange={onChange}
              options={guideSections.map((s) => ({
                value: s.role,
                label: s.role === role ? `${s.label} (you)` : s.label,
              }))}
            />
          </div>
        </div>
        <p className="shrink-0 rounded-pill bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
          {stepCount} steps
        </p>
      </div>

      <p className="border-t border-line bg-canvas-sunken px-6 py-4 text-sm leading-7 text-ink sm:px-9">
        {summary}
      </p>
    </header>
  );
}

function GuideSectionTitle({
  id,
  eyebrow,
  title,
  hint,
}: {
  id: string;
  eyebrow: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-brand-700">
          {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-title font-semibold text-ink">
          {title}
        </h2>
      </div>
      <p className="shrink-0 text-xs font-medium text-ink-subtle">{hint}</p>
    </div>
  );
}
