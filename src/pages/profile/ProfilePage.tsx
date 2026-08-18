import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useProfile,
  type OwnProject,
  type SupervisedProject,
  type UserProfile,
} from '@/features/profiles/useProfiles';
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
    <div className="space-y-2 text-sm text-ink">
      {profile?.about && <p className="whitespace-pre-wrap">{profile.about}</p>}
      {profile?.contactEmail && (
        <p className="text-xs text-ink-muted">
          Contact:{' '}
          <a className="text-brand-700 hover:underline" href={`mailto:${profile.contactEmail}`}>
            {profile.contactEmail}
          </a>
        </p>
      )}
      {profile?.links && Object.keys(profile.links).length > 0 && (
        <ul className="text-xs">
          {Object.entries(profile.links).map(([label, url]) => (
            <li key={label}>
              <a className="text-brand-700 hover:underline" href={url} target="_blank" rel="noreferrer">
                {label}
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
function ResearchTab({ profile, isStudent }: { profile: UserProfile | null; isStudent: boolean }) {
  const interests = profile?.interests ?? [];
  const outputs = profile?.outputs ?? [];

  return (
    <div className="space-y-4">
      {interests.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink">{isStudent ? 'Skills and interests' : 'Areas'}</p>
          <div className="mt-1 flex flex-wrap gap-1">
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
          <p className="text-xs font-medium text-ink">
            {isStudent ? 'Work and achievements' : 'Publications and projects'}
          </p>
          <ul className="mt-1 space-y-1">
            {outputs.map((o) => (
              <li key={o.id} className="text-sm text-ink">
                {o.url ? (
                  <a className="text-brand-700 hover:underline" href={o.url} target="_blank" rel="noreferrer">
                    {o.title}
                  </a>
                ) : (
                  o.title
                )}
                <span className="text-xs text-ink-subtle">
                  {o.venue ? ` · ${o.venue}` : ''}
                  {o.year ? ` · ${o.year}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Derived from allocations rather than stored, so it can never drift from what
// actually happened.
function SupervisedTab({ projects }: { projects: SupervisedProject[] }) {
  return (
    <ul className="space-y-3">
      {projects.map((p, i) => (
        <li key={i} className="border-b border-line pb-2 last:border-b-0">
          <p className="text-sm font-medium text-ink">{p.title}</p>
          <p className="text-xs text-ink-muted">
            {p.course} · {p.academicYear} · {p.projectType}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {p.students.map((s) => `${s.fullName ?? s.studentId} (${s.studentId})`).join(', ')}
          </p>
        </li>
      ))}
    </ul>
  );
}

function OwnProjectsTab({ projects }: { projects: OwnProject[] }) {
  return (
    <ul className="space-y-3">
      {projects.map((p, i) => (
        <li key={i} className="border-b border-line pb-2 last:border-b-0">
          <p className="text-sm font-medium text-ink">{p.title}</p>
          <p className="text-xs text-ink-muted">
            {p.course} · {p.academicYear} · {p.projectType}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {p.groupName}
            {p.supervisor && (
              <>
                {' · supervised by '}
                <Link to={`/profile/${p.supervisor.id}`} className="text-brand-700 hover:underline">
                  {p.supervisor.fullName ?? p.supervisor.email}
                </Link>
              </>
            )}
          </p>
        </li>
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
  const isStudent = data.user.role === 'STUDENT';
  const isMe = data.user.id === myUserId;
  const name = personName(data.user);

  const hasAbout = !!(
    profile?.about ||
    profile?.contactEmail ||
    (profile?.links && Object.keys(profile.links).length)
  );
  const hasResearch = (profile?.interests.length ?? 0) > 0 || (profile?.outputs.length ?? 0) > 0;
  const projects = isStudent ? data.ownProjects : data.supervisedProjects;

  // Tabs come from the person, not from a fixed list. A student used to be shown
  // "Research" and "Projects supervised" — two tabs that could only ever be
  // empty for them. An empty tab is hidden rather than shown blank.
  const tabs = (
    [
      { value: 'about' as const, label: 'About', show: hasAbout },
      {
        value: 'research' as const,
        label: isStudent ? 'Skills and interests' : 'Research',
        show: hasResearch,
      },
      {
        value: 'projects' as const,
        label: isStudent ? 'Projects done' : 'Projects supervised',
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
        back={{ label: 'Back' }}
        actions={
          isMe && (
            <LinkButton to="/profile/edit" variant="secondary" size="sm">
              Edit my profile
            </LinkButton>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={name} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{name}</h2>
              <Badge tone={isStudent ? 'info' : 'brand'}>{isStudent ? 'Student' : 'Lecturer'}</Badge>
            </div>

            {profile?.headline && <p className="mt-1 text-sm text-ink-muted">{profile.headline}</p>}

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-muted">
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
                    className="text-brand-700 underline-offset-2 hover:underline"
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
              ? 'Add an About, your interests and anything you have worked on — students and colleagues read this.'
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
            {active === 'research' && <ResearchTab profile={profile} isStudent={isStudent} />}
            {active === 'projects' &&
              (isStudent ? (
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
