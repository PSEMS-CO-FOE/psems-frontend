import { useState } from 'react';
import { useNotifications, useMarkNotificationRead } from '@/features/notifications/useNotifications';

export function NotificationsBell() {
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);

  const unread = notifications?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {(!notifications || notifications.length === 0) && (
            <p className="p-4 text-center text-xs text-gray-500">No notifications.</p>
          )}
          <ul className="divide-y">
            {notifications?.map((n) => (
              <li
                key={n.id}
                className={`p-3 ${n.readAt ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>
                  </div>
                  {!n.readAt && (
                    <button
                      onClick={() => markRead.mutate(n.id)}
                      className="shrink-0 text-xs text-blue-600 hover:underline"
                    >
                      mark read
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
