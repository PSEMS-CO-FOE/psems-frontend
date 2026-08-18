import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';
import { NotificationsBell } from '@/components/NotificationsBell';
import { Avatar, Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import crest from '@/assets/crest.png';
import { useShellTitle } from './shellTitle';
import { ShellTitleProvider } from './ShellTitleProvider';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Only match the exact path — for the section's own index route. */
  end?: boolean;
}

export interface AppShellProps {
  /** Shown under the wordmark, e.g. "Coordinator". */
  roleLabel: string;
  /** Where the wordmark links to. */
  homeTo: string;
  nav: ShellNavItem[];
}

const COLLAPSE_KEY = 'psems-sidebar-collapsed';

function TopBar({
  roleLabel,
  collapsed,
  onToggleRail,
}: {
  roleLabel: string;
  collapsed: boolean;
  onToggleRail: () => void;
}) {
  const title = useShellTitle();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleRail}
          aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          title={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          className="hidden h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast ease-standard hover:bg-line/50 hover:text-ink lg:flex"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
        </button>

        <div className="min-w-0 lg:min-w-[12rem]">
          <p className="truncate text-sm font-semibold text-ink">{title ?? roleLabel}</p>
          <p className="truncate text-xs text-ink-subtle">Faculty of Engineering — USJ</p>
        </div>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <NotificationsBell />
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-control px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-fast ease-standard hover:bg-line/50 hover:text-ink lg:hidden"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ roleLabel, homeTo, nav }: AppShellProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 rounded-control py-2 text-sm font-medium transition-colors duration-fast ease-standard',
      collapsed ? 'justify-center px-0' : 'px-3',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-line/50 hover:text-ink',
    );

  return (
    <ShellTitleProvider>
      <div className="min-h-screen bg-canvas">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-base ease-standard lg:flex',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <Link
            to={homeTo}
            className={cn(
              'flex h-14 shrink-0 items-center gap-3 border-b border-line transition-colors duration-fast ease-standard hover:bg-canvas',
              collapsed ? 'justify-center px-0' : 'px-5',
            )}
          >
            <img src={crest} alt="" className="h-8 w-8 shrink-0 object-contain" />
            {!collapsed && (
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight text-ink">PSEMS</span>
                <span className="block truncate text-xs text-ink-subtle">{roleLabel}</span>
              </span>
            )}
          </Link>

          <nav className={cn('flex-1 space-y-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navItemClass}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} />
                {!collapsed && item.label}
              </NavLink>
            ))}
          </nav>

          <div className={cn('border-t border-line py-3', collapsed ? 'px-2' : 'px-3')}>
            <Link
              to="/profile/edit"
              title={collapsed ? user?.email : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-control py-2 transition-colors duration-fast ease-standard hover:bg-canvas',
                collapsed ? 'justify-center px-0' : 'px-3',
              )}
            >
              <Avatar name={user?.email} size="sm" />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-ink" title={user?.email}>
                    {user?.email ?? 'Signed in'}
                  </span>
                  <span className="block text-xs text-ink-subtle">My profile</span>
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className={cn(
                'mt-1 flex w-full items-center gap-2.5 rounded-control py-2 text-xs font-medium text-ink-muted transition-colors duration-fast ease-standard hover:bg-line/50 hover:text-ink',
                collapsed ? 'justify-center px-0' : 'px-3',
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {!collapsed && 'Log out'}
            </button>
          </div>
        </aside>

        <div
          className={cn(
            'transition-[padding] duration-base ease-standard',
            collapsed ? 'lg:pl-16' : 'lg:pl-60',
          )}
        >
          <TopBar
            roleLabel={roleLabel}
            collapsed={collapsed}
            onToggleRail={() => setCollapsed((v) => !v)}
          />

          {/* Below lg the rail is hidden, so the same links run along the top
              rather than becoming unreachable. */}
          <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-4 py-2 sm:px-6 lg:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-control px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-standard',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-muted hover:bg-line/50 hover:text-ink',
                  )
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <main
            className={cn(
              'mx-auto px-4 py-6 transition-[max-width] duration-base ease-standard sm:px-6 lg:py-8',
              collapsed ? 'max-w-wide' : 'max-w-content',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </ShellTitleProvider>
  );
}
