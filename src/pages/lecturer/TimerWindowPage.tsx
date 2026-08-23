import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { formatClock, useControlTimer, useTimer, type TimerSegment } from '@/features/scheduling/useTimer';
import { bootstrapSession } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import crest from '@/assets/crest.png';

// Read from across a room, so it stays outside the theme: always dark, always
// maximum contrast. It borrows the app's shapes but not its tokens.
const IDLE_MS = 4000;

const GROUND = '#080E0B';
const BRAND = '#3DB166';

function segmentTone(segment: TimerSegment, isCurrent: boolean) {
  if (segment.overranSeconds > 0) return 'border-red-500/60 bg-red-950/50 text-red-200';
  if (isCurrent) return 'border-[#3DB166]/70 bg-[#3DB166]/15 text-[#8DD5A8]';
  if (segment.completedAt) return 'border-white/10 bg-white/5 text-white/45';
  return 'border-white/10 text-white/30';
}

function Shell({ children, tone = 'text-white/60' }: { children: ReactNode; tone?: string }) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center p-8 text-center text-2xl ${tone}`}
      style={{ backgroundColor: GROUND }}
    >
      <div className="max-w-xl space-y-6">
        <img src={crest} alt="" className="mx-auto h-14 w-14 rounded-xl bg-white/95 object-contain p-1.5" />
        {children}
      </div>
    </div>
  );
}

/** The five controls, as one shape rather than five loose buttons. */
const ACTIONS = [
  { action: 'start', label: 'Start', path: 'M8 5v14l11-7z' },
  { action: 'pause', label: 'Pause', path: 'M8 5v14M16 5v14' },
  { action: 'previous', label: 'Previous', path: 'M19 20 9 12l10-8v16zM5 19V5' },
  { action: 'next', label: 'Next', path: 'M5 4l10 8-10 8V4zM19 5v14' },
  { action: 'stop', label: 'Stop', path: 'M6 6h12v12H6z' },
] as const;

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

  // Fade out when idle rather than disappear, like a video player.
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
  // Capped so an overrun fills the bar rather than overflowing it.
  const progress =
    current && current.targetSeconds > 0
      ? Math.min(100, (current.elapsedSeconds / current.targetSeconds) * 100)
      : 0;

  return (
    <div
      className={`relative flex min-h-screen flex-col px-[4vw] py-[3vh] text-white ${
        // Across a room the number alone is easy to miss; the whole screen
        // takes the state so overrun is visible from the back row.
        overrunning ? 'ring-[0.6vw] ring-inset ring-red-600' : ''
      }`}
      style={{ backgroundColor: GROUND }}
    >
      {/* Stops the ground reading as a dead black rectangle on a projector. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(60% 45% at 15% -10%, rgba(61,177,102,0.16), transparent 70%), radial-gradient(50% 40% at 100% 0%, rgba(61,177,102,0.08), transparent 65%)',
        }}
      />

      <header className="relative flex items-center gap-[1.2vw]">
        <img
          src={crest}
          alt=""
          className="h-[3.4vw] w-[3.4vw] shrink-0 rounded-[0.6vw] bg-white/95 object-contain p-[0.4vw]"
        />
        <div className="min-w-0">
          <p className="text-[1vw] font-semibold uppercase tracking-[0.3em] text-white/40">
            PSEMS · Faculty of Engineering
          </p>
          <p className="mt-[0.3vh] truncate text-[1.7vw] font-semibold tracking-tight text-white/85">
            {data.group} <span className="text-white/35">·</span> {data.stage}
          </p>
        </div>

        {/* Says whether the clock is running, without watching the digits. */}
        <span
          className={`ml-auto flex shrink-0 items-center gap-[0.6vw] rounded-full px-[1.2vw] py-[0.7vh] text-[1.1vw] font-semibold uppercase tracking-[0.2em] ${
            running ? 'bg-[#3DB166]/20 text-[#8DD5A8]' : 'bg-white/10 text-white/45'
          }`}
        >
          <span
            className={`h-[0.7vw] w-[0.7vw] rounded-full ${running ? 'motion-safe:animate-pulse' : ''}`}
            style={{ backgroundColor: running ? BRAND : 'rgba(255,255,255,0.35)' }}
          />
          {running ? 'Running' : 'Paused'}
        </span>
      </header>

      <div className="relative flex flex-1 flex-col justify-center">
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
          <>
            {/* The bar reads from the back of a room where four digits do not. */}
            <div className="mt-[1.5vh] h-[0.5vh] w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${progress}%`,
                  backgroundColor: overrunning ? '#EF4444' : BRAND,
                }}
              />
            </div>

            <p className="mt-[1.2vh] text-[2vw] text-white/55">
              {formatClock(current.elapsedSeconds)} of {formatClock(current.targetSeconds)}
              {overrunning && (
                <span className="ml-[2vw] text-red-400">over by {formatClock(current.overranSeconds)}</span>
              )}
            </p>
          </>
        )}

        <p className="mt-[0.5vh] text-[1.4vw] text-white/35">
          Session total {formatClock(data.elapsedSeconds)}
        </p>
      </div>

      <ul className="relative flex flex-wrap gap-[0.6vw]">
        {data.segments.map((segment) => (
          <li
            key={segment.id}
            className={`flex items-center gap-[1vw] rounded-[0.8vw] border px-[1.2vw] py-[0.8vh] text-[1.3vw] ${segmentTone(
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
        className={`relative mt-[2vh] flex flex-wrap items-center gap-[0.8vw] transition-opacity duration-slow ease-standard focus-within:opacity-100 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ACTIONS.map(({ action, label, path }) => {
          // Whichever of start/pause is next carries the brand fill.
          const primary = running ? action === 'pause' : action === 'start';
          return (
            <button
              key={action}
              onClick={() => run(action)}
              disabled={control.isPending}
              className={`flex items-center gap-[0.6vw] rounded-[0.8vw] px-[1.6vw] py-[1vh] text-[1.3vw] font-medium transition-colors disabled:opacity-40 ${
                primary ? 'text-white' : 'bg-white/10 text-white/85 hover:bg-white/20'
              }`}
              style={primary ? { backgroundColor: BRAND } : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[1.4vw] w-[1.4vw]"
                fill={action === 'start' || action === 'stop' ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={path} />
              </svg>
              {label}
            </button>
          );
        })}

        <span className="ml-[1vw] text-[1vw] text-white/35">
          Space start or pause · ← → move between segments
        </span>
      </div>

      {control.isError && (
        <p role="alert" className="relative mt-[1vh] text-[1.3vw] text-red-400">
          {getApiErrorMessage(control.error)}
        </p>
      )}
    </div>
  );
}
