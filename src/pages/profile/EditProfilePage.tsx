import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMyProfile,
  useUpdateMyProfile,
  type ResearchOutput,
  type ResearchOutputKind,
} from '@/features/profiles/useProfiles';
import { getApiErrorMessage } from '@/lib/apiError';

const KINDS: ResearchOutputKind[] = ['PUBLICATION', 'PROJECT', 'GRANT', 'OTHER'];

const blankOutput = (): ResearchOutput => ({ title: '', venue: '', year: undefined, url: '', kind: 'PUBLICATION' });

export function EditProfilePage() {
  const { data, isLoading } = useMyProfile();
  const update = useUpdateMyProfile();

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

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">My profile</h3>
        <p className="mt-1 text-xs text-gray-500">
          Anyone signed in can read this. Students use it when choosing a supervisor, so research areas are worth
          filling in — they are what the supervisor search filters on.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-gray-600">
            Headline
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Senior Lecturer, Networks"
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-gray-600">
            Department
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-gray-600">
            Designation
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
          <label className="text-xs text-gray-600">
            Contact email
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
            />
          </label>
        </div>

        <label className="mt-2 block text-xs text-gray-600">
          About
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </label>

        <label className="mt-2 block text-xs text-gray-600">
          Research areas (comma separated)
          <input
            value={areas}
            onChange={(e) => setAreas(e.target.value)}
            placeholder="Wireless, IoT, Embedded systems"
            className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
          />
        </label>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs font-medium text-gray-700">Publications and projects</p>
        <div className="mt-2 space-y-1">
          {outputs.map((o, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1">
              <input
                value={o.title}
                onChange={(e) => setOutput(i, { title: e.target.value })}
                placeholder="title"
                className="min-w-48 flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <input
                value={o.venue ?? ''}
                onChange={(e) => setOutput(i, { venue: e.target.value })}
                placeholder="venue"
                className="w-32 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <input
                type="number"
                value={o.year ?? ''}
                onChange={(e) => setOutput(i, { year: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="year"
                className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <input
                value={o.url ?? ''}
                onChange={(e) => setOutput(i, { url: e.target.value })}
                placeholder="url"
                className="w-40 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <select
                value={o.kind}
                onChange={(e) => setOutput(i, { kind: e.target.value as ResearchOutputKind })}
                className="rounded border border-gray-300 px-1 py-1 text-xs"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k.toLowerCase()}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setOutputs((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-xs text-red-500 hover:underline"
              >
                remove
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOutputs((prev) => [...prev, blankOutput()])}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          + add
        </button>
      </div>

      {update.isError && <p className="text-xs text-red-600">{getApiErrorMessage(update.error)}</p>}
      {update.isSuccess && <p className="text-xs text-green-600">Profile saved.</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={update.isPending}
          className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {update.isPending ? '…' : 'Save profile'}
        </button>
        {data?.user.id && (
          <Link to={`/profile/${data.user.id}`} className="text-xs text-blue-600 hover:underline">
            View as others see it
          </Link>
        )}
      </div>
    </div>
  );
}
