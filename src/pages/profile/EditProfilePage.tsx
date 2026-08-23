import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMyProfile,
  useUpdateMyProfile,
  type ProfileUpdate,
  type ResearchOutput,
  type ResearchOutputKind,
} from '@/features/profiles/useProfiles';
import { profileShape } from '@/features/profiles/profileShape';
import { getApiErrorMessage } from '@/lib/apiError';
import { Button, Card, Field, Notice, PageHeader, SkeletonCard, Textarea } from '@/components/ui';

const KINDS: ResearchOutputKind[] = ['PUBLICATION', 'PROJECT', 'GRANT', 'OTHER'];

const blankOutput = (): ResearchOutput => ({ title: '', venue: '', year: undefined, url: '', kind: 'PUBLICATION' });

const rowInput =
  'h-9 rounded-control border border-line-strong bg-surface px-2.5 text-xs text-ink placeholder:text-ink-subtle transition-colors duration-fast ease-standard hover:border-ink-subtle focus:border-brand-500';

export function EditProfilePage() {
  const { data, isLoading } = useMyProfile();
  const update = useUpdateMyProfile();
  // The same two collections serve both kinds of person; only the labels differ,
  // so a student is not asked for "publications" they will never have — and an
  // administrator, who has neither, is not asked at all.
  const shape = profileShape(data?.user.role);
  const showResearch = shape.interestsLabel != null;

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

  const save = () => {
    const payload: ProfileUpdate = {
      headline: headline.trim() || null,
      about: about.trim() || null,
      department: department.trim() || null,
      designation: designation.trim() || null,
      contactEmail: contactEmail.trim() || null,
    };

    // Replace-all on the server: omit rather than send an empty array.
    if (showResearch) {
      payload.interests = areas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      payload.outputs = outputs
        .filter((o) => o.title.trim())
        .map((o) => ({
          title: o.title.trim(),
          venue: o.venue?.trim() || undefined,
          year: o.year || undefined,
          url: o.url?.trim() || undefined,
          kind: o.kind,
        }));
    }

    update.mutate(payload);
  };

  if (isLoading) return <SkeletonCard rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit my profile"
        eyebrow={shape.roleLabel}
        description={shape.editorNote}
        back={{ label: 'Back' }}
        actions={
          <Button variant="primary" size="sm" onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        }
      />

      <Card accent title="Who you are" description="Shown at the top of your profile.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={shape.headlinePlaceholder}
            className="sm:col-span-2"
          />
          <Field
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Electrical and Electronic Engineering"
          />
          <Field
            label={shape.kind === 'administrator' ? 'Office or role' : 'Designation'}
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder={shape.kind === 'administrator' ? 'Faculty office' : 'Senior Lecturer'}
          />
          <Field
            label="Contact email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            hint="Leave blank to use your sign-in address."
            className="sm:col-span-2"
          />
          <Textarea
            label="About"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="sm:col-span-2"
          />
        </div>
      </Card>

      {showResearch && (
        <>
          <Card
            title={shape.interestsLabel}
            description="Comma separated. These are what the directory filters on, so keep them short."
          >
            <Field
              label={
                shape.kind === 'student' ? 'Skills and interests' : 'Research areas'
              }
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              placeholder={shape.interestsPlaceholder}
            />
          </Card>

          <Card title={shape.outputsLabel} description={shape.outputsHint}>
            {outputs.length === 0 && (
              <p className="text-xs text-ink-subtle">Nothing listed yet.</p>
            )}
            <div className="space-y-2">
              {outputs.map((o, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-control bg-canvas-sunken p-2"
                >
                  <input
                    value={o.title}
                    onChange={(e) => setOutput(i, { title: e.target.value })}
                    placeholder="Title"
                    aria-label="Title"
                    className={`${rowInput} min-w-48 flex-1`}
                  />
                  <input
                    value={o.venue ?? ''}
                    onChange={(e) => setOutput(i, { venue: e.target.value })}
                    placeholder="Venue"
                    aria-label="Venue"
                    className={`${rowInput} w-32`}
                  />
                  <input
                    type="number"
                    value={o.year ?? ''}
                    onChange={(e) => setOutput(i, { year: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Year"
                    aria-label="Year"
                    className={`${rowInput} w-20`}
                  />
                  <input
                    value={o.url ?? ''}
                    onChange={(e) => setOutput(i, { url: e.target.value })}
                    placeholder="Link"
                    aria-label="Link"
                    className={`${rowInput} w-40`}
                  />
                  <select
                    value={o.kind}
                    onChange={(e) => setOutput(i, { kind: e.target.value as ResearchOutputKind })}
                    aria-label="Kind"
                    className={`${rowInput} pr-1`}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="danger-quiet"
                    size="sm"
                    onClick={() => setOutputs((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setOutputs((prev) => [...prev, blankOutput()])}
            >
              + Add an entry
            </Button>
          </Card>
        </>
      )}

      {update.isError && <Notice tone="critical">{getApiErrorMessage(update.error)}</Notice>}
      {update.isSuccess && <Notice tone="positive">Profile saved.</Notice>}

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save profile'}
        </Button>
        {data?.user.id && (
          <Link
            to={`/profile/${data.user.id}`}
            className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            View as others see it
          </Link>
        )}
      </div>
    </div>
  );
}
