import { useState } from 'react';
import { useEvaluationConfig } from '@/features/evaluations/useEvaluationConfig';
import { downloadCsv, markSheetFilename, markSheetToCsv } from '@/features/marks/export';
import {
  useAggregateMarks,
  useGradeBands,
  useMarks,
  useMarkSheet,
  usePublications,
  useSetGradeBands,
  useSetPublication,
  type MarkPublication,
} from '@/features/marks/useMarks';
import { getApiErrorMessage } from '@/lib/apiError';
import { downloadMarksSheet } from '@/features/marks/marksSheetPdf';
import { DownloadPdfButton } from '@/features/pdf/DownloadPdfButton';
import { Button, Card, EmptyState, Notice, SkeletonText, StatRow, StatTile } from '@/components/ui';

// Marks and comments publish separately, per stage or for the whole course, and
// either can be turned off again.
function PublishRow({
  cpiId,
  stageId,
  label,
  publication,
}: {
  cpiId: string;
  stageId: string | null;
  label: string;
  publication?: MarkPublication;
}) {
  const setPublication = useSetPublication(cpiId);
  const marks = publication?.publishMarks ?? false;
  const comments = publication?.publishComments ?? false;
  const grades = publication?.publishGrades ?? false;

  const set = (next: { publishMarks?: boolean; publishComments?: boolean; publishGrades?: boolean }) =>
    setPublication.mutate({
      stageId,
      publishMarks: next.publishMarks ?? marks,
      publishComments: next.publishComments ?? comments,
      publishGrades: next.publishGrades ?? grades,
    });

  return (
    <div className="flex flex-wrap items-center gap-3 py-1 text-xs">
      <span className="w-40 text-ink">{label}</span>
      <label className="flex items-center gap-1 text-ink-muted">
        <input type="checkbox" checked={marks} onChange={(e) => set({ publishMarks: e.target.checked })} />
        marks
      </label>
      <label className="flex items-center gap-1 text-ink-muted">
        <input type="checkbox" checked={comments} onChange={(e) => set({ publishComments: e.target.checked })} />
        comments
      </label>
      {/* Released separately, and usually later — marks go out during the
          semester, the grade only once everything is in. */}
      <label className="flex items-center gap-1 text-ink-muted">
        <input type="checkbox" checked={grades} onChange={(e) => set({ publishGrades: e.target.checked })} />
        grade
      </label>
      {publication?.publishedAt && (
        <span className="text-ink-subtle">since {new Date(publication.publishedAt).toLocaleDateString()}</span>
      )}
      {setPublication.isError && <span className="text-critical-700">{getApiErrorMessage(setPublication.error)}</span>}
    </div>
  );
}

function GradeBandsPanel({ cpiId, gradingEnabled }: { cpiId: string; gradingEnabled: boolean }) {
  const { data: bands } = useGradeBands(cpiId);
  const save = useSetGradeBands(cpiId);
  const [draft, setDraft] = useState<{ label: string; minPercent: number }[] | null>(null);

  const rows = draft ?? bands?.map((b) => ({ label: b.label, minPercent: b.minPercent })) ?? [];

  if (!gradingEnabled) {
    return (
      <p className="text-xs text-ink-muted">
        This course awards marks only. Turn on grading in Course settings to add grade bands.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {rows.map((band, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
          <input
            value={band.label}
            onChange={(e) => setDraft(rows.map((b, j) => (i === j ? { ...b, label: e.target.value } : b)))}
            placeholder="A"
            className="w-16 rounded-control border border-line-strong px-2 py-0.5"
          />
          <span className="text-ink-muted">from</span>
          <input
            type="number"
            min={0}
            max={100}
            value={band.minPercent}
            onChange={(e) => setDraft(rows.map((b, j) => (i === j ? { ...b, minPercent: Number(e.target.value) } : b)))}
            className="w-20 rounded-control border border-line-strong px-2 py-0.5"
          />
          <span className="text-ink-muted">%</span>
          <button onClick={() => setDraft(rows.filter((_, j) => j !== i))} className="rounded-control border border-critical-500/35 bg-critical-50 px-2 py-1 text-xs font-medium text-critical-700 transition-colors duration-fast ease-standard hover:border-critical-500/60">
            remove
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDraft([...rows, { label: '', minPercent: 50 }])}
          className="rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400"
        >
          + grade
        </button>
        <Button variant="primary" size="sm"
          onClick={() => save.mutate(rows, { onSuccess: () => setDraft(null) })}
          disabled={!draft || rows.some((b) => !b.label.trim()) || save.isPending}>
          {save.isPending ? '…' : 'Save grades'}
        </Button>
        {save.isError && <span className="text-xs text-critical-700">{getApiErrorMessage(save.error)}</span>}
      </div>
    </div>
  );
}

function MarkSheetPanel({ cpiId }: { cpiId: string }) {
  const [open, setOpen] = useState(false);
  const { data: sheet, isLoading, isError, error } = useMarkSheet(cpiId, open);

  return (
    <div className="border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setOpen((v) => !v)} className="rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition-colors duration-fast ease-standard hover:border-brand-400">
          {open ? 'Hide CA sheet' : 'CA sheet'}
        </button>
        {open && sheet && (
          <>
            <Button variant="neutral" size="sm"
              onClick={() => downloadCsv(markSheetFilename(sheet), markSheetToCsv(sheet))}>
              Download CSV
            </Button>
            <DownloadPdfButton onDownload={() => downloadMarksSheet(sheet)} />
          </>
        )}
      </div>

      {open && isLoading && <SkeletonText className="mt-2" />}
      {open && isError && <Notice tone="critical" size="xs" className="mt-2">{getApiErrorMessage(error)}</Notice>}

      {open && sheet && (
        <div className="mt-3 table-scroll">
          {sheet.flagged > 0 && (
            <p className="mb-2 text-xs font-medium text-caution-700">
              {sheet.flagged} student(s) have a total of zero — check they were scored.
            </p>
          )}
          {/* Who to look at, not a verdict: PSEMS never tells a student they
              have been repeated. */}
          {sheet.belowPassMark > 0 && sheet.passMarkPercent !== null && (
            <p className="mb-2 text-xs font-medium text-caution-700">
              {sheet.belowPassMark} student(s) fell below the {sheet.passMarkPercent}% pass mark.
            </p>
          )}
          <table className="data-table min-w-full text-xs">
            <thead>
              <tr>
                <th>Index</th>
                <th>Reg. No</th>
                <th>Surname</th>
                <th>Initials</th>
                {sheet.stages.map((stage) => (
                  <th key={stage.id}>
                    {stage.name}
                  </th>
                ))}
                <th>Total</th>
                {sheet.gradingEnabled && <th>Grade</th>}
              </tr>
              <tr className="bg-canvas-sunken text-left text-[11px] font-medium text-ink-subtle">
                <td>Weight</td>
                <td /> <td /> <td />
                {sheet.stages.map((stage) => (
                  <td key={stage.id}>
                    {sheet.weights[stage.id]?.toFixed(2)}
                  </td>
                ))}
                <td>1.00</td>
                {sheet.gradingEnabled && <td />}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row) => (
                <tr
                  key={row.indexNumber}
                  className={row.zeroTotal || row.belowPassMark ? 'bg-caution-50 text-ink' : 'text-ink'}
                >
                  <td>{row.indexNumber}</td>
                  <td>{row.registrationNumber ?? '—'}</td>
                  <td>{row.surname}</td>
                  <td>{row.initials}</td>
                  {sheet.stages.map((stage) => (
                    <td key={stage.id}>
                      {row.stagePercents[stage.id] ?? '—'}
                    </td>
                  ))}
                  <td className="font-semibold text-ink">{row.total}</td>
                  {sheet.gradingEnabled && <td>{row.grade ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CpiMarks({ cpiId }: { cpiId: string }) {
  const { data: marks } = useMarks(cpiId);
  const { data: stages } = useEvaluationConfig(cpiId);
  const { data: publications } = usePublications(cpiId);
  const aggregate = useAggregateMarks(cpiId);

  const publicationFor = (stageId: string | null) =>
    publications?.find((p) => p.evaluationStageId === stageId);

  // A stage's own row wins; otherwise the course-wide row applies. Same rule the
  // backend uses to decide what a student can see.
  const courseWide = publicationFor(null);
  const publishedStages = (stages ?? []).filter((stage) => {
    const own = publicationFor(stage.id);
    return own ? own.publishMarks : (courseWide?.publishMarks ?? false);
  }).length;

  const groupCount = marks?.groups.length ?? 0;
  const studentCount = marks?.groups.reduce((total, g) => total + g.students.length, 0) ?? 0;
  const stageCount = stages?.length ?? 0;

  return (
    <div className="space-y-5">
      <StatRow>
        <StatTile label="Groups" value={groupCount} caption={groupCount === 0 ? 'Not aggregated yet' : 'With aggregated marks'} />
        <StatTile label="Students" value={studentCount} caption="Carrying an individual mark" />
        <StatTile
          label="Stages released"
          value={`${publishedStages} / ${stageCount}`}
          caption="Marks visible to students"
        />
        <StatTile
          label="Awaiting release"
          value={stageCount - publishedStages}
          caption={stageCount - publishedStages === 0 ? 'Everything is out' : 'Still hidden from students'}
        />
      </StatRow>

      <Card
        title="What students can see"
        description="A stage’s own setting wins; otherwise the whole-course setting applies. Ticking the grade without the marks is a normal choice — students then see only their grade, worked out from figures they are never shown."
        actions={
          <Button onClick={() => aggregate.mutate()} disabled={aggregate.isPending}>
            {aggregate.isPending ? 'Aggregating…' : 'Aggregate'}
          </Button>
        }
      >
        {aggregate.isError && (
          <Notice tone="critical" size="xs" className="mb-3">
            {getApiErrorMessage(aggregate.error)}
          </Notice>
        )}
        <PublishRow cpiId={cpiId} stageId={null} label="Whole course" publication={publicationFor(null)} />
        {stages?.map((stage) => (
          <PublishRow
            key={stage.id}
            cpiId={cpiId}
            stageId={stage.id}
            label={stage.name}
            publication={publicationFor(stage.id)}
          />
        ))}
      </Card>

      <Card title="Grade bands">
        <GradeBandsPanel cpiId={cpiId} gradingEnabled={marks?.gradingEnabled ?? false} />
      </Card>

      <Card title="Marks by group" flush>
      <ul className="divide-y divide-line">
        {marks?.groups.map((group) => (
          <li key={group.groupId} className="px-5 py-3 text-xs">
            <p className="font-medium text-ink">
              {group.groupName} — overall {group.overall}
              {group.grade && <span className="ml-1 text-ink-muted">({group.grade})</span>}
            </p>
            <p className="text-ink-subtle">
              {group.stages.map((s) => `${s.stageName}: ${s.stageScorePercent}% (×${s.weight}%)`).join(' · ')}
            </p>
            {/* Only worth listing per student when they actually differ. */}
            {group.students.length > 0 && (
              <ul className="mt-0.5 pl-3">
                {group.students.map((student) => (
                  <li key={student.studentId} className="text-ink-muted">
                    {student.indexNumber} {student.name} — {student.overall}
                    {student.grade && ` (${student.grade})`}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        {marks && marks.groups.length === 0 && (
          <li className="px-5 py-4">
            <EmptyState
              density="compact"
              title="No marks yet"
              hint="Press Aggregate once every panel has finished scoring."
            />
          </li>
        )}
      </ul>
      </Card>

      <MarkSheetPanel cpiId={cpiId} />
    </div>
  );
}
