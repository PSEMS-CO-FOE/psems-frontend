import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfile, type SupervisedProject, type UserProfile } from '@/features/profiles/useProfiles';
import { getApiErrorMessage } from '@/lib/apiError';
import { personName } from '@/lib/name';

type Tab = 'about' | 'research' | 'projects';

const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'research', label: 'Research' },
  { key: 'projects', label: 'Projects supervised' },
];

function AboutTab({ profile }: { profile: UserProfile | null }) {
  if (!profile?.about && !profile?.headline && !profile?.contactEmail) {
    return <p className="text-sm text-gray-500">Nothing here yet.</p>;
  }
  return (
    <div className="space-y-2 text-sm text-gray-700">
      {profile.about && <p className="whitespace-pre-wrap">{profile.about}</p>}
      {profile.contactEmail && (
        <p className="text-xs text-gray-500">
          Contact: <a className="text-blue-600 hover:underline" href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>
        </p>
      )}
      {profile.links && Object.keys(profile.links).length > 0 && (
        <ul className="text-xs">
          {Object.entries(profile.links).map(([label, url]) => (
            <li key={label}>
              <a className="text-blue-600 hover:underline" href={url} target="_blank" rel="noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResearchTab({ profile }: { profile: UserProfile | null }) {
  const interests = profile?.interests ?? [];
  const outputs = profile?.outputs ?? [];

  if (interests.length === 0 && outputs.length === 0) {
    return <p className="text-sm text-gray-500">No research areas or outputs listed.</p>;
  }

  return (
    <div className="space-y-4">
      {interests.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700">Areas</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {interests.map((i) => (
              <span key={i.id} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                {i.area}
              </span>
            ))}
          </div>
        </div>
      )}
      {outputs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700">Publications and projects</p>
          <ul className="mt-1 space-y-1">
            {outputs.map((o) => (
              <li key={o.id} className="text-sm text-gray-700">
                {o.url ? (
                  <a className="text-blue-600 hover:underline" href={o.url} target="_blank" rel="noreferrer">
                    {o.title}
                  </a>
                ) : (
                  o.title
                )}
                <span className="text-xs text-gray-400">
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
function ProjectsTab({ projects }: { projects: SupervisedProject[] }) {
  if (projects.length === 0) {
    return <p className="text-sm text-gray-500">No supervised projects yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {projects.map((p, i) => (
        <li key={i} className="border-b pb-2 last:border-b-0">
          <p className="text-sm font-medium text-gray-800">{p.title}</p>
          <p className="text-xs text-gray-500">
            {p.course} · {p.academicYear} · {p.projectType}
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {p.students.map((s) => `${s.fullName ?? s.studentId} (${s.studentId})`).join(', ')}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ProfilePage() {
  const { userId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('about');
  const { data, isLoading, isError, error } = useProfile(userId);

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (isError) {
    return <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{getApiErrorMessage(error)}</p>;
  }

  const profile = data!.profile;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-800">{personName(data!.user)}</h2>
        {profile?.headline && <p className="text-sm text-gray-600">{profile.headline}</p>}
        <p className="mt-1 text-xs text-gray-400">
          {[profile?.designation, profile?.department].filter(Boolean).join(' · ') || data!.user.email}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <nav className="flex gap-2 border-b pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-3 py-1 text-xs font-medium ${
                tab === t.key ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-3">
          {tab === 'about' && <AboutTab profile={profile} />}
          {tab === 'research' && <ResearchTab profile={profile} />}
          {tab === 'projects' && <ProjectsTab projects={data!.supervisedProjects} />}
        </div>
      </div>

      <Link to="/profile/edit" className="text-xs text-blue-600 hover:underline">
        Edit my profile
      </Link>
    </div>
  );
}
