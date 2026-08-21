import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatClock, useControlTimer, useTimer, type TimerSegment } from '@/features/scheduling/useTimer';
import { bootstrapSession } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';

// This window is read from across a room off a second monitor, so it is
// deliberately outside the light/dark theme: always black, always maximum
// contrast. The app's tokens describe a document on a white page, which is the
// wrong instrument here.
const IDLE_MS = 4000;

function segmentTone(segment: TimerSegment, isCurrent: boolean) {
  if (segment.overranSeconds > 0) return 'border-red-500/70 bg-red-950/60 text-red-200';
  if (isCurrent) return 'border-emerald-400/70 bg-emerald-950/60 text-emerald-100';
  if (segment.completedAt) return 'border-white/15 bg-white/5 text-white/50';
  return 'border-white/10 text-white/35';
}

function Shell({ children, tone = 'text-white/60' }: { children: React.ReactNode; tone?: string }) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-black p-8 text-2xl ${tone}`}>
      {children}
    </div>
  );
}

export function TimerWindowPage() {
  const { cpiId = '', sessionId = '' } = useParams();
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const idleTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (hasToken) return;
    bootstrapSession().catch(() =>
      setBootstrapError('This window could not pick up your session. Sign in again in the main window, then reopen it.'),
    );
  }, [hasToken]);

  const { data, isError, error } = useTimer(cpiId, sessionId, { enabled: hasToken, refetchInterval: 1000 });
  const control = useControlTimer(cpiId, sessionId);

  // The controls are chrome for the room but essential for the evaluator, so
  // they fade out when idle rather than being removed — the way a video player
  // does it. Any input brings them back.
  const wake = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setControlsVisible(false), IDLE_MS);
  }, []);

  const run = control.mutate;
  const running = data?.running ?? false;

  useEffect(() => {
    wake();
    const onKeyDown = (event: KeyboardEvent) => {
      wake();
      // Driving it from the keyboard is what lets the buttons hide at all.
      if (event.key === ' ') {
        event.preventDefault();
        run(running ? 'pause' : 'start');
      } else if (event.key === 'ArrowRight') {
        run('next');
      } else if (event.key === 'ArrowLeft') {
        run('previous');
      }
    };

    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(idleTimer.current);
    };
  }, [wake, run, running]);

  if (bootstrapError) return <Shell tone="text-red-300">{bootstrapError}</Shell>;
  if (!hasToken || (!data && !isError)) return <Shell>Connecting…</Shell>;
  if (isError || !data) return <Shell tone="text-red-300">{getApiErrorMessage(error)}</Shell>;

  const current = data.segments.find((s) => s.orderIndex === data.currentSegmentIndex) ?? null;
  const remaining = current ? current.targetSeconds - current.elapsedSeconds : 0;
  const overrunning = !!current && current.elapsedSeconds > current.targetSeconds;

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-black px-[4vw] py-[3vh] text-white ${
        // Across a room the number alone is easy to miss; the whole screen
        // takes the state so overrun is visible from the back row.
        overrunning ? 'ring-[0.6vw] ring-inset ring-red-600' : ''
      }`}
    >
      <p className="text-[1.6vw] uppercase tracking-[0.3em] text-white/45">
        {data.group} · {data.stage}
      </p>

      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[3.4vw] font-semibold leading-tight text-white/85">
          {current?.name ?? 'No segments configured'}
        </p>

        {/* Counts down to the target, then keeps going as a negative. Going over
            is something to show, not a reason to move on. */}
        <p
          className={`text-projector font-mono text-[clamp(6rem,20vw,22rem)] font-medium leading-[0.85] ${
            overrunning ? 'text-red-500 motion-safe:animate-pulse' : 'text-white'
          }`}
        >
          {current ? formatClock(remaining) : formatClock(data.elapsedSeconds)}
        </p>

        {current && (
          <p className="mt-[1vh] text-[2vw] text-white/55">
            {formatClock(current.elapsedSeconds)} of {formatClock(current.targetSeconds)}
            {overrunning && (
              <span className="ml-[2vw] text-red-400">over by {formatClock(current.overranSeconds)}</span>
            )}
          </p>
        )}

        <p className="mt-[0.5vh] text-[1.4vw] text-white/35">
          Session total {formatClock(data.elapsedSeconds)}
        </p>
      </div>

      <ul className="flex flex-wrap gap-[0.6vw]">
        {data.segments.map((segment) => (
          <li
            key={segment.id}
            className={`flex items-center gap-[1vw] rounded-lg border px-[1.2vw] py-[0.8vh] text-[1.3vw] ${segmentTone(
              segment,
              segment.orderIndex === data.currentSegmentIndex,
            )}`}
          >
            <span>{segment.name}</span>
            <span className="font-mono">
              {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
            </span>
          </li>
        ))}
      </ul>

      {/* Faded out rather than removed, so `focus-within` can bring it straight
          back — an invisible button that still takes Tab focus is the trap this
          avoids. */}
      <div
        className={`mt-[2vh] flex flex-wrap items-center gap-[0.8vw] transition-opacity duration-slow ease-standard focus-within:opacity-100 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {(['start', 'pause', 'previous', 'next', 'stop'] as const).map((action) => (
          <button
            key={action}
            onClick={() => run(action)}
            disabled={control.isPending}
            className="rounded-lg bg-white/10 px-[1.6vw] py-[1vh] text-[1.3vw] capitalize text-white hover:bg-white/20 disabled:opacity-40"
          >
            {action}
          </button>
        ))}
        <span className="ml-[1vw] text-[1vw] text-white/35">
          Space start or pause · ← → move between segments
        </span>
      </div>

      {control.isError && (
        <p role="alert" className="mt-[1vh] text-[1.3vw] text-red-400">
          {getApiErrorMessage(control.error)}
        </p>
      )}
    </div>
  );
}
