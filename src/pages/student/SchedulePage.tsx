import { useParams } from 'react-router-dom';
import { useSessions, type EvaluationSession } from '@/features/scheduling/useScheduling';
import { getApiErrorMessage } from '@/lib/apiError';
import {
  Badge,
  Card,
  EmptyState,
  Notice,
  SectionHeader,
  SkeletonCard,
  StatRow,
  StatTile,
  type BadgeTone,
} from '@/components/ui';

const statusTone: Record<string, BadgeTone> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'caution',
  AWAITING_REVIEW: 'caution',
  FINALIZED: 'positive',
};

function humanStatus(status: string) {
  const words = status.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTimeRange(start: string, end: string | null) {
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const from = new Date(start);
  return end ? `${time(from)} – ${time(new Date(end))}` : time(from);
}

function SessionCard({ session }: { session: EvaluationSession }) {
  const start = session.scheduledStart;

  return (
    <Card interactive>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{session.stage.name}</h3>
          {start ? (
            <>
              <p className="mt-1 text-sm text-ink">{formatDay(start)}</p>
              <p className="text-sm text-ink-muted">
                {formatTimeRange(start, session.scheduledEnd)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">A time has not been set yet.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {session.isOverdue && <Badge tone="critical">Overdue</Badge>}
          <Badge tone={statusTone[session.status] ?? 'neutral'}>
            {humanStatus(session.status)}
          </Badge>
        </div>
      </div>

      {(session.location || session.allocatedMinutes) && (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-3 text-xs">
          {session.location && (
            <div>
              <dt className="text-ink-subtle">Venue</dt>
              <dd className="mt-0.5 font-medium text-ink">{session.location}</dd>
            </div>
          )}
          {session.allocatedMinutes && (
            <div>
              <dt className="text-ink-subtle">Your slot</dt>
              <dd className="mt-0.5 font-medium text-ink">{session.allocatedMinutes} minutes</dd>
            </div>
          )}
        </dl>
      )}
    </Card>
  );
}

export function SchedulePage() {
  const { cpiId = '' } = useParams();
  const { data: sessions, isLoading, isError, error } = useSessions(cpiId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard rows={2} />
        <SkeletonCard rows={2} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Schedule" />
        <Notice tone="critical">
          {getApiErrorMessage(error, 'Could not load your schedule')}
        </Notice>
      </div>
    );
  }

  const all = sessions ?? [];
  const now = Date.now();

  // Unscheduled sessions sort last: they are real and worth seeing, but they
  // are not something to turn up for yet.
  const dated = all
    .filter((s) => s.scheduledStart)
    .sort((a, b) => Date.parse(a.scheduledStart!) - Date.parse(b.scheduledStart!));
  const undated = all.filter((s) => !s.scheduledStart);

  const upcoming = dated.filter((s) => Date.parse(s.scheduledStart!) >= now);
  const past = dated.filter((s) => Date.parse(s.scheduledStart!) < now).reverse();
  const next = upcoming[0];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Schedule"
        description="When and where your group presents, for every stage of this course."
      />

      {all.length > 0 && (
        <StatRow>
          <StatTile
            label="Next session"
            value={next ? formatTimeRange(next.scheduledStart!, next.scheduledEnd) : '—'}
            caption={next ? formatDay(next.scheduledStart!) : 'Nothing upcoming'}
          />
          <StatTile label="Upcoming" value={upcoming.length} caption="Still to present" />
          <StatTile label="Completed" value={past.length} caption="Already presented" />
          <StatTile
            label="Awaiting a time"
            value={undated.length}
            caption={undated.length === 0 ? 'All sessions are placed' : 'Your coordinator sets these'}
          />
        </StatRow>
      )}

      {all.length === 0 && (
        <EmptyState
          title="No sessions yet"
          hint="Your coordinator creates evaluation sessions once groups and stages are set up. You will be notified when a time is booked."
        />
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Upcoming
          </h2>
          {upcoming.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </section>
      )}

      {undated.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Not yet timetabled
          </h2>
          {undated.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Completed
          </h2>
          {past.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </section>
      )}
    </div>
  );
}
