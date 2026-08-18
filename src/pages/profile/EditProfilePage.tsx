import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMyProfile,
  useUpdateMyProfile,
  type ResearchOutput,
  type ResearchOutputKind,
} from '@/features/profiles/useProfiles';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, PageHeader, SkeletonCard } from '@/components/ui';

const KINDS: ResearchOutputKind[] = ['PUBLICATION', 'PROJECT', 'GRANT', 'OTHER'];

const blankOutput = (): ResearchOutput => ({ title: '', venue: '', year: undefined, url: '', kind: 'PUBLICATION' });

export function EditProfilePage() {
  const { data, isLoading } = useMyProfile();
  const update = useUpdateMyProfile();
  // The same two collections serve both kinds of person; only the labels differ,
  // so a student is not asked for "publications" they will never have.
  const isStudent = data?.user.role === 'STUDENT';

  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  // Areas are edited as one comma-separated line — they are short tags, and a
  // per-tag editor would be more chrome than content.
  const [areas, setAreas] = useState('');
  const [outputs, setOutputs] = useState<ResearchOutput[]>([]);

  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setHeadline(p.headline ?? '');
    setAbout(p.about ?? '');
    setDepartment(p.department ?? '');
    setDesignation(p.designation ?? '');
    setContactEmail(p.contactEmail ?? '');
    setAreas(p.interests.map((i) => i.area).join(', '));
    setOutputs(p.outputs.map((o) => ({ ...o })));
  }, [data]);

  const setOutput = (i: number, patch: Partial<ResearchOutput>) =>
    setOutputs((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const save = () =>
    update.mutate({
      headline: headline.trim() || null,
      about: about.trim() || null,
      department: department.trim() || null,
      designation: designation.trim() || null,
      contactEmail: contactEmail.trim() || null,
      interests: areas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      outputs: outputs
        .filter((o) => o.title.trim())
        .map((o) => ({
          title: o.title.trim(),
          venue: o.venue?.trim() || undefined,
          year: o.year || undefined,
          url: o.url?.trim() || undefined,
          kind: o.kind,
        })),
    });

  if (isLoading) return <SkeletonCard rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit my profile"
        back={{ label: 'Back' }}
      />

      <Card
        description={
          isStudent
            ? 'Anyone signed in can read this. Listing what you are good at and interested in is how supervisors and teammates find you.'
            : 'Anyone signed in can read this. Students use it when choosing a supervisor, so research areas are worth filling in — they are what the directory filters on.'
        }
      >

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-ink-muted">
            Headline
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={isStudent ? 'Final year, interested in embedded systems' : 'Senior Lecturer, Networks'}
              className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-ink-muted">
            Department
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-ink-muted">
            Designation
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-ink-muted">
            Contact email
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
            />
          </label>
        </div>

        <label className="mt-2 block text-xs text-ink-muted">
          About
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
          />
        </label>

        <label className="mt-2 block text-xs text-ink-muted">
          {isStudent ? 'Skills and interests (comma separated)' : 'Research areas (comma separated)'}
          <input
            value={areas}
            onChange={(e) => setAreas(e.target.value)}
            placeholder={isStudent ? 'React, Machine learning, Robotics' : 'Wireless, IoT, Embedded systems'}
            className="mt-0.5 w-full rounded-control border border-line-strong px-2 py-1 text-xs"
          />
        </label>
      </Card>

      <Card>
        <p className="text-xs font-medium text-ink">
          {isStudent ? 'Work and achievements' : 'Publications and projects'}
        </p>
        <p className="mt-0.5 text-xs text-ink-subtle">
          {isStudent
            ? 'Competition entries, side projects, anything you have built or won.'
            : 'Papers, funded projects and grants.'}
        </p>
        <div className="mt-2 space-y-1">
          {outputs.map((o, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1">
              <input
                value={o.title}
                onChange={(e) => setOutput(i, { title: e.target.value })}
                placeholder="title"
                className="min-w-48 flex-1 rounded-control border border-line-strong px-2 py-1 text-xs"
              />
              <input
                value={o.venue ?? ''}
                onChange={(e) => setOutput(i, { venue: e.target.value })}
                placeholder="venue"
                className="w-32 rounded-control border border-line-strong px-2 py-1 text-xs"
              />
              <input
                type="number"
                value={o.year ?? ''}
                onChange={(e) => setOutput(i, { year: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="year"
                className="w-20 rounded-control border border-line-strong px-2 py-1 text-xs"
              />
              <input
                value={o.url ?? ''}
                onChange={(e) => setOutput(i, { url: e.target.value })}
                placeholder="url"
                className="w-40 rounded-control border border-line-strong px-2 py-1 text-xs"
              />
              <select
                value={o.kind}
                onChange={(e) => setOutput(i, { kind: e.target.value as ResearchOutputKind })}
                className="rounded-control border border-line-strong px-1 py-1 text-xs"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k.toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setOutputs((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-xs text-critical-700 hover:underline"
              >
                remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOutputs((prev) => [...prev, blankOutput()])}
          className="mt-2 text-xs text-brand-700 hover:underline"
        >
          + add
        </button>
      </Card>

      {update.isError && <p className="text-xs text-critical-700">{getApiErrorMessage(update.error)}</p>}
      {update.isSuccess && <p className="text-xs text-positive-700">Profile saved.</p>}

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm"
          onClick={save}
          disabled={update.isPending}>
          {update.isPending ? '…' : 'Save profile'}
        </Button>
        {data?.user.id && (
          <Link to={`/profile/${data.user.id}`} className="text-xs text-brand-700 hover:underline">
            View as others see it
          </Link>
        )}
      </div>
    </div>
  );
}
