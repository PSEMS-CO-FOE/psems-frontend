import { useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProfile,
  type OwnProject,
  type SupervisedProject,
  type UserProfile,
} from '@/features/profiles/useProfiles';
import { profileShape, type ProfileShape } from '@/features/profiles/profileShape';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';
import {
  Avatar,
  Badge,
  LinkButton,
  Card,
  EmptyState,
  Notice,
  PageHeader,
  Segmented,
  SkeletonCard,
} from '@/components/ui';

type TabKey = 'about' | 'research' | 'projects';

function AboutTab({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="space-y-4">
      {profile?.about && (
        <p className="max-w-prose whitespace-pre-wrap text-sm leading-7 text-ink">{profile.about}</p>
      )}
      {profile?.contactEmail && (
        <p className="text-xs text-ink-muted">
          Contact:{' '}
          <a
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
            href={`mailto:${profile.contactEmail}`}
          >
            {profile.contactEmail}
          </a>
        </p>
      )}
      {profile?.links && Object.keys(profile.links).length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {Object.entries(profile.links).map(([label, url]) => (
            <li key={label}>
              <a
                className="inline-flex items-center gap-1.5 rounded-pill bg-canvas-sunken px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-line transition-colors duration-fast ease-standard hover:ring-brand-200"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {label}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Same two collections for everyone; only the words change. A student's
// competition entry and a lecturer's paper are both a ResearchOutput, so the
// model does not need to know which kind of person it belongs to.
function ResearchTab({ profile, shape }: { profile: UserProfile | null; shape: ProfileShape }) {
  const interests = profile?.interests ?? [];
  const outputs = profile?.outputs ?? [];

  return (
    <div className="space-y-6">
      {interests.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            {shape.interestsLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {interests.map((i) => (
              <Badge key={i.id} tone="info">
                {i.area}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {outputs.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            {shape.outputsLabel}
          </p>
          <ul className="mt-2 divide-y divide-line">
            {outputs.map((o) => (
              <li key={o.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm font-medium text-ink">
                  {o.url ? (
                    <a
                      className="text-brand-700 underline-offset-2 hover:underline"
                      href={o.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {o.title}
                    </a>
                  ) : (
                    o.title
                  )}
                </p>
                {(o.venue || o.year) && (
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {[o.venue, o.year].filter(Boolean).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** One row of the projects list. Both directions share the frame; only the
 *  third line differs — who did the work, or who supervised it. */
function ProjectRow({
  title,
  course,
  academicYear,
  projectType,
  detail,
}: {
  title: string;
  course: string;
  academicYear: string;
  projectType: string;
  detail: ReactNode;
}) {
  return (
    <li className="border-l-2 border-line py-1 pl-4 transition-colors duration-fast ease-standard hover:border-brand-400">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {course} · {academicYear} · {projectType}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">{detail}</p>
    </li>
  );
}

// Derived from allocations rather than stored, so it can never drift from what
// actually happened.
function SupervisedTab({ projects }: { projects: SupervisedProject[] }) {
  return (
    <ul className="space-y-4">
      {projects.map((p, i) => (
        <ProjectRow
          key={i}
          {...p}
          detail={p.students.map((s) => `${s.fullName ?? s.studentId} (${s.studentId})`).join(', ')}
        />
      ))}
    </ul>
  );
}

function OwnProjectsTab({ projects }: { projects: OwnProject[] }) {
  return (
    <ul className="space-y-4">
      {projects.map((p, i) => (
        <ProjectRow
          key={i}
          {...p}
          detail={
            <>
              {p.groupName}
              {p.supervisor && (
                <>
                  {' · supervised by '}
                  <Link
                    to={`/profile/${p.supervisor.id}`}
                    className="font-medium text-brand-700 underline-offset-2 hover:underline"
                  >
                    {p.supervisor.fullName ?? p.supervisor.email}
                  </Link>
                </>
              )}
            </>
          }
        />
      ))}
    </ul>
  );
}

export function ProfilePage() {
  const { userId = '' } = useParams();
  const [tab, setTab] = useState<TabKey>('about');
  const { data, isLoading, isError, error } = useProfile(userId);
  const myUserId = useAuthStore((s) => s.user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={5} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" back={{ label: 'Back' }} />
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load this profile')}</Notice>
      </div>
    );
  }
  if (!data) return null;

  const profile = data.profile;
  const shape = profileShape(data.user.role);
  const isMe = data.user.id === myUserId;
  const name = personName(data.user);

  const hasAbout = !!(
    profile?.about ||
    profile?.contactEmail ||
    (profile?.links && Object.keys(profile.links).length)
  );
  // An administrator holds neither, and the shape says so — so the tab is not
  // merely empty for them, it does not exist.
  const hasResearch =
    shape.interestsLabel != null &&
    ((profile?.interests.length ?? 0) > 0 || (profile?.outputs.length ?? 0) > 0);
  const projects =
    shape.projectsSource === 'own'
      ? data.ownProjects
      : shape.projectsSource === 'supervised'
        ? data.supervisedProjects
        : [];

  // Tabs come from the person, not from a fixed list. A student used to be shown
  // "Research" and "Projects supervised" — two tabs that could only ever be
  // empty for them. An empty tab is hidden rather than shown blank.
  const tabs = (
    [
      { value: 'about' as const, label: 'About', show: hasAbout },
      {
        value: 'research' as const,
        label: shape.interestsLabel ?? 'Research',
        show: hasResearch,
      },
      {
        value: 'projects' as const,
        label: shape.projectsLabel ?? 'Projects',
        show: projects.length > 0,
      },
    ] satisfies { value: TabKey; label: string; show: boolean }[]
  ).filter((t) => t.show);

  const active = tabs.some((t) => t.value === tab) ? tab : tabs[0]?.value;

  return (
    <div className="space-y-6">
      {/* No fixed destination: a profile is reached from the directory, from a
          past project and from search, so history is the honest way back. */}
      <PageHeader
        title={name}
        eyebrow={shape.roleLabel}
        back={{ label: 'Back' }}
        actions={
          isMe && (
            <div className="flex flex-wrap gap-2">
              <LinkButton to="/change-password" variant="secondary" size="sm">
                Change password
              </LinkButton>
              <LinkButton to="/profile/edit" variant="primary" size="sm">
                Edit my profile
              </LinkButton>
            </div>
          )
        }
      />

      {/* The identity card carries the brand band; everything below is plain. */}
      <Card flush className="overflow-hidden">
        <div aria-hidden="true" className="h-20 bg-brand-gradient" />
        <div className="flex flex-wrap items-end gap-4 px-5 pb-5 sm:px-6">
          <Avatar name={name} role={data.user.role} size="lg" className="-mt-8 ring-4" />

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{name}</h2>
              <Badge tone={shape.badgeTone}>{shape.roleLabel}</Badge>
            </div>

            {profile?.headline && (
              <p className="mt-1 max-w-prose text-sm text-ink-muted">{profile.headline}</p>
            )}

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-muted">
              {profile?.designation && (
                <div>
                  <dt className="sr-only">Designation</dt>
                  <dd>{profile.designation}</dd>
                </div>
              )}
              {profile?.department && (
                <div>
                  <dt className="sr-only">Department</dt>
                  <dd>{profile.department}</dd>
                </div>
              )}
              <div>
                <dt className="sr-only">Email</dt>
                <dd>
                  <a
                    href={`mailto:${data.user.email}`}
                    className="font-medium text-brand-700 underline-offset-2 hover:underline"
                  >
                    {data.user.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      {tabs.length === 0 ? (
        <EmptyState
          title="This profile is empty"
          hint={
            isMe
              ? shape.kind === 'administrator'
                ? 'Add a contact address and which office you sit in — this is what people see when they need an administrator.'
                : 'Add an About, your interests and anything you have worked on — students and colleagues read this.'
              : 'Nothing has been filled in yet.'
          }
          action={
            isMe && (
              <LinkButton to="/profile/edit" variant="primary" size="sm">
                Fill in my profile
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {/* One tab is not a choice, so the switcher only appears when there is one. */}
          {tabs.length > 1 && (
            <Segmented
              label="Profile sections"
              options={tabs.map(({ value, label }) => ({ value, label }))}
              value={active as TabKey}
              onChange={setTab}
            />
          )}

          <Card>
            {active === 'about' && <AboutTab profile={profile} />}
            {active === 'research' && <ResearchTab profile={profile} shape={shape} />}
            {active === 'projects' &&
              (shape.projectsSource === 'own' ? (
                <OwnProjectsTab projects={data.ownProjects} />
              ) : (
                <SupervisedTab projects={data.supervisedProjects} />
              ))}
          </Card>
        </div>
      )}
    </div>
  );
}
