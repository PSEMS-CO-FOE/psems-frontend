import type { ReactNode } from 'react';
import crest from '@/assets/crest.png';

/**
 * The signed-out split: the university on the left, the form on the right.
 * Below `lg` the green panel is dropped rather than stacked — on a short screen
 * it would push the form under the fold, and the form is the reason for the page.
 */
export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  /** Small caps line above the form heading, e.g. "Secure sign in". */
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 px-14 py-12 lg:flex lg:flex-col">
        {/* Concentric rings, echoing the crest without competing with it. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 motion-safe:animate-drift">
          <div className="absolute -right-24 -top-40 h-[34rem] w-[34rem] rounded-full border border-white/10" />
          <div className="absolute -left-56 -bottom-20 h-[42rem] w-[42rem] rounded-full border border-white/10" />
          <div className="absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-white/[0.04]" />
        </div>

        <div className="relative flex items-center gap-3 motion-safe:animate-fade-up">
          <img src={crest} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <span>
            <span className="block text-sm font-semibold text-white">
              University of Sri Jayewardenepura
            </span>
            <span className="block text-xs text-white/70">Faculty of Engineering</span>
          </span>
        </div>

        <div className="relative mt-auto">
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60 motion-safe:animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            Intelligent PSEMS
          </p>

          <h1
            className="mt-5 max-w-xl text-5xl font-semibold leading-[1.08] tracking-tight text-white motion-safe:animate-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            Project supervision, evaluation &amp; management.
          </h1>

          <p
            className="mt-6 max-w-md text-sm leading-relaxed text-white/75 motion-safe:animate-fade-up"
            style={{ animationDelay: '300ms' }}
          >
            A single, secure workspace for proposals, supervision milestones, panel evaluations and
            final grading across the faculty.
          </p>

          <div
            className="mt-10 max-w-md border-t border-white/20 pt-8 motion-safe:animate-fade-in"
            style={{ animationDelay: '380ms' }}
          />

          {/* Statements of how the system works, not usage figures — there is no
              live cohort yet, and an invented number here would be a claim the
              product cannot support. */}
          <dl className="grid max-w-md grid-cols-3 gap-6">
            {[
              ['End to end', 'Proposal to final grade'],
              ['Isolated', 'Panel scores until review'],
              ['Audited', 'Every change recorded'],
            ].map(([term, detail], i) => (
              <div
                key={term}
                className="motion-safe:animate-fade-up"
                style={{ animationDelay: `${420 + i * 90}ms` }}
              >
                <dt className="text-xl font-semibold text-white">{term}</dt>
                <dd className="mt-1 text-[11px] uppercase leading-relaxed tracking-wider text-white/55">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p
          className="relative mt-12 text-xs text-white/45 motion-safe:animate-fade-in"
          style={{ animationDelay: '600ms' }}
        >
          © {new Date().getFullYear()} Faculty of Engineering · University of Sri Jayewardenepura
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm motion-safe:animate-slide-in">
          {/* The crest again, only where the green panel is not on screen. */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={crest} alt="" className="h-10 w-10 shrink-0 object-contain" />
            <span>
              <span className="block text-sm font-semibold text-ink">PSEMS</span>
              <span className="block text-xs text-ink-subtle">Faculty of Engineering — USJ</span>
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-2 text-sm text-ink-muted">{description}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  );
}
