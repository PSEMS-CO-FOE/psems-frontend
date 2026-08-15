import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatClock, useControlTimer, useTimer, type TimerSegment } from '@/features/scheduling/useTimer';
import { bootstrapSession } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';

function segmentTone(segment: TimerSegment, isCurrent: boolean) {
  if (segment.overranSeconds > 0) return 'border-red-500 bg-red-950 text-red-200';
  if (isCurrent) return 'border-emerald-500 bg-emerald-950 text-emerald-100';
  if (segment.completedAt) return 'border-gray-700 bg-gray-900 text-gray-400';
  return 'border-gray-800 bg-gray-950 text-gray-500';
}

export function TimerWindowPage() {
  const { cpiId = '', sessionId = '' } = useParams();
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    if (hasToken) return;
    bootstrapSession().catch(() =>
      setBootstrapError('This window could not pick up your session. Sign in again in the main window, then reopen it.'),
    );
  }, [hasToken]);

  const { data, isError, error } = useTimer(cpiId, sessionId, { enabled: hasToken, refetchInterval: 1000 });
  const control = useControlTimer(cpiId, sessionId);

  if (bootstrapError) {
    return <div className="min-h-screen bg-black p-8 text-lg text-red-300">{bootstrapError}</div>;
  }
  if (!hasToken || (!data && !isError)) {
    return <div className="min-h-screen bg-black p-8 text-lg text-gray-400">Connecting…</div>;
  }
  if (isError || !data) {
    return <div className="min-h-screen bg-black p-8 text-lg text-red-300">{getApiErrorMessage(error)}</div>;
  }

  const current = data.segments.find((s) => s.orderIndex === data.currentSegmentIndex) ?? null;
  const remaining = current ? current.targetSeconds - current.elapsedSeconds : 0;
  const overrunning = !!current && current.elapsedSeconds > current.targetSeconds;

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <p className="text-sm uppercase tracking-widest text-gray-500">
        {data.group} · {data.stage}
      </p>

      <p className="mt-4 text-4xl font-semibold text-gray-200">{current?.name ?? 'No segments configured'}</p>

      {/* The big number counts down to the target, then keeps going in red as a
          minus. Going over is something to show, not a reason to move on. */}
      <p
        className={`mt-2 font-mono text-[9rem] leading-none ${
          overrunning ? 'animate-pulse text-red-500' : 'text-white'
        }`}
      >
        {current ? formatClock(remaining) : formatClock(data.elapsedSeconds)}
      </p>

      {current && (
        <p className="mt-1 text-2xl text-gray-400">
          {formatClock(current.elapsedSeconds)} of {formatClock(current.targetSeconds)}
          {overrunning && <span className="ml-3 text-red-400">over by {formatClock(current.overranSeconds)}</span>}
        </p>
      )}

      <p className="mt-1 text-lg text-gray-500">Session total {formatClock(data.elapsedSeconds)}</p>

      <ul className="mt-6 space-y-1">
        {data.segments.map((segment) => (
          <li
            key={segment.id}
            className={`flex items-center justify-between rounded border px-3 py-2 text-lg ${segmentTone(
              segment,
              segment.orderIndex === data.currentSegmentIndex,
            )}`}
          >
            <span>{segment.name}</span>
            <span className="font-mono">
              {formatClock(segment.elapsedSeconds)} / {formatClock(segment.targetSeconds)}
              {segment.timeliness && <span className="ml-3 text-sm">{segment.timeliness.toLowerCase()}</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        {(['start', 'pause', 'previous', 'next', 'stop'] as const).map((action) => (
          <button
            key={action}
            onClick={() => control.mutate(action)}
            disabled={control.isPending}
            className="rounded bg-gray-800 px-5 py-2 text-lg capitalize hover:bg-gray-700 disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      {control.isError && <p className="mt-2 text-red-400">{getApiErrorMessage(control.error)}</p>}
    </div>
  );
}
