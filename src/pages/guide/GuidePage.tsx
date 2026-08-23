import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { guideSections } from './guideContent';
import { markingIntro, markingPoints } from './markingExplainer';
import { Card, PageHeader, Segmented } from '@/components/ui';
import type { Role } from '@/types/auth';

/**
 * One guide, written per role. It opens on the reader's own role but lets them
 * switch, because the person most often looking up how a student does something
 * is the coordinator being asked.
 */
export function GuidePage() {
  const role = useAuthStore((s) => s.user?.role);
  const [shown, setShown] = useState<Role>(role ?? 'STUDENT');

  const section = guideSections.find((s) => s.role === shown) ?? guideSections[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="How to use PSEMS"
        description="What each role does, in the order they do it."
      />

      <Segmented
        label="Guide for role"
        value={shown}
        onChange={setShown}
        options={guideSections.map((s) => ({
          value: s.role,
          label: s.role === role ? `${s.label} (you)` : s.label,
        }))}
      />

      <p className="text-sm leading-relaxed text-ink-muted">{section.summary}</p>

      <ol className="space-y-4">
        {section.steps.map((step, index) => (
          <li key={step.title}>
            <Card>
              <div className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-sm font-semibold text-ink">{step.title}</h2>
                  <p className="text-sm leading-relaxed text-ink-muted">{step.body}</p>
                  {step.screenshot && (
                    <figure className="mt-3 overflow-hidden rounded-card border border-line">
                      <img
                        src={`/guide/${step.screenshot}`}
                        alt={`Screenshot: ${step.title}`}
                        className="w-full"
                        loading="lazy"
                      />
                    </figure>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      {/* Shown to every role rather than only the coordinator: a student who
          cannot see how their number was reached has no way to question it. */}
      <section className="space-y-4 pt-2">
        <div>
          <h2 className="text-base font-semibold text-ink">How marking works</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{markingIntro}</p>
        </div>

        <Card flush>
          <dl className="divide-y divide-line">
            {markingPoints.map((point) => (
              <div key={point.heading} className="px-4 py-3">
                <dt className="text-sm font-semibold text-ink">{point.heading}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-muted">{point.body}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <Card title="Still stuck?">
        <p className="text-sm leading-relaxed text-ink-muted">
          Ask your course coordinator first — they can see the state of your course and fix most
          things themselves. Account problems, such as being locked out or suspended, go to the
          system administrator instead.
        </p>
      </Card>
    </div>
  );
}
