import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Whether the lifecycle phase behind a tab is usable right now. The timeline
 *  already knows this; the tabs used to ignore it. */
export type TabStatus = 'open' | 'closed' | 'upcoming';

export interface TabItem {
  to: string;
  label: string;
  status?: TabStatus;
  end?: boolean;
}

const statusDot: Record<TabStatus, string> = {
  open: 'bg-brand-500',
  closed: 'bg-ink-subtle',
  upcoming: 'bg-caution-500',
};

const statusLabel: Record<TabStatus, string> = {
  open: 'open',
  closed: 'closed',
  upcoming: 'not yet open',
};

export function TabNav({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <nav className={cn('flex flex-wrap items-center gap-1', className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                : 'text-ink-muted hover:bg-line/50 hover:text-ink',
            )
          }
        >
          {item.status && (
            <span
              className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDot[item.status])}
              aria-hidden="true"
            />
          )}
          {item.label}
          {/* Status is carried by the dot's position for sighted users and by
              this text for everyone else — never by colour alone. */}
          {item.status && <span className="sr-only"> ({statusLabel[item.status]})</span>}
        </NavLink>
      ))}
    </nav>
  );
}
