import { useEffect, useRef, useState } from 'react';
import { useNotifications, useMarkNotificationRead } from '@/features/notifications/useNotifications';
import { cn } from '@/lib/cn';

export function NotificationsBell() {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // A popover that only closes by pressing the control that opened it is a trap:
  // the reader has already moved on and clicked something else. Pointer-down
  // rather than click, so it closes before the click lands underneath.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors',
          open ? 'bg-brand-50 text-brand-700' : 'hover:bg-line/50 hover:text-ink',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 max-h-96 w-80 overflow-y-auto rounded-card border border-line bg-surface shadow-pop">
          <header className="sticky top-0 border-b border-line bg-surface px-4 py-2.5">
            <h2 className="text-xs font-semibold text-ink">Notifications</h2>
          </header>
          {(!notifications || notifications.length === 0) && (
            <p className="px-4 py-8 text-center text-xs text-ink-subtle">Nothing yet.</p>
          )}
          <ul className="divide-y divide-line">
            {notifications?.map((n) => (
              <li key={n.id} className={cn('px-4 py-3', !n.readAt && 'bg-brand-50/60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{n.body}</p>
                  </div>
                  {!n.readAt && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      className="shrink-0 rounded-control text-xs font-medium text-brand-700 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
