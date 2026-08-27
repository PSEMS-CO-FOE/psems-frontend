import { useEffect, useState, type CSSProperties } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useLogout';
import { NotificationsBell } from '@/components/NotificationsBell';
import { Avatar, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import crest from '@/assets/crest.png';
import { useShellTitle } from './shellTitle';
import { ShellTitleProvider } from './ShellTitleProvider';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import type { Workspace, WorkspaceId } from './workspaces';

export interface AppShellProps {
  /** Who the reader is, e.g. "Coordinator" — not what they are doing. */
  roleLabel: string;
  /** Every hat the reader holds. More than one puts a switcher in the rail. */
  workspaces: Workspace[];
  currentId: WorkspaceId;
}

const COLLAPSE_KEY = 'psems-sidebar-collapsed';

const RAIL_WIDTH = { expanded: '15rem', collapsed: '4rem' } as const;

// Mirrors `max-w-content` / `max-w-wide`, so the footer centres on the same column.
const CONTENT_MAX = { expanded: '72rem', collapsed: '86rem' } as const;

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
    <header className="sticky top-0 z-20 border-b border-line surface-glass">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleRail}
          aria-label={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          title={collapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-control text-ink-subtle transition-colors duration-fast ease-standard hover:bg-brand-50 hover:text-brand-700 lg:flex"
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

        {/* Eyebrow over title: the line that changes carries the weight. */}
        <div className="min-w-0 lg:min-w-[13rem]">
          <p className="truncate text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
            Faculty of Engineering · USJ
          </p>
          <p className="truncate text-[15px] font-semibold leading-tight tracking-tight text-ink">
            {title ?? roleLabel}
          </p>
        </div>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <NotificationsBell />
          <ThemeToggle />
          <button
            onClick={logout}
            className="rounded-control px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors duration-fast ease-standard hover:bg-critical-50 hover:text-critical-700 lg:hidden"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ roleLabel, workspaces, currentId }: AppShellProps) {
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];
  const { home: homeTo, nav } = current;
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Published for the fixed footer, which is outside the layout flow.
  const railVars = {
    '--rail-w': collapsed ? RAIL_WIDTH.collapsed : RAIL_WIDTH.expanded,
    '--content-max': collapsed ? CONTENT_MAX.collapsed : CONTENT_MAX.expanded,
  } as CSSProperties;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center gap-3 rounded-control py-2.5 text-sm font-medium transition-all duration-fast ease-standard',
      collapsed ? 'justify-center px-0' : 'px-3',
      isActive
        ? 'bg-brand-50 text-brand-700 shadow-card'
        : 'text-ink-muted hover:bg-line/40 hover:text-ink',
    );

  return (
    <ShellTitleProvider>
      <div className="min-h-screen bg-canvas-sunken" style={railVars}>
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-base ease-standard lg:flex',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          {/* The one piece of solid brand colour in the chrome. */}
          <Link
            to={homeTo}
            className={cn(
              'relative flex h-16 shrink-0 items-center gap-3 overflow-hidden bg-brand-gradient text-white transition-opacity duration-fast ease-standard hover:opacity-95',
              collapsed ? 'justify-center px-0' : 'px-5',
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10"
            />
            <img
              src={crest}
              alt=""
              className="relative h-9 w-9 shrink-0 rounded-lg bg-white/95 object-contain p-1 shadow-card"
            />
            {!collapsed && (
              <span className="relative min-w-0">
                <span className="block text-sm font-semibold tracking-tight">PSEMS</span>
                <span className="block truncate text-[11px] font-medium text-white/75">
                  {roleLabel}
                </span>
              </span>
            )}
          </Link>

          <div className={cn('border-b border-line py-3', collapsed ? 'px-2' : 'px-3')}>
            {!collapsed && workspaces.length > 1 && (
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
                Working as
              </p>
            )}
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentId={current.id}
              variant={collapsed ? 'collapsed' : 'rail'}
            />
          </div>

          <nav className={cn('flex-1 space-y-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-subtle">
                Workspace
              </p>
            )}
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navItemClass}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {/* A bar on the rail's edge, not just a tint. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-pill bg-brand-500 transition-opacity duration-fast ease-standard',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon name={item.icon} />
                    {!collapsed && item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className={cn('border-t border-line py-3', collapsed ? 'px-2' : 'px-3')}>
            <Link
              to="/profile/edit"
              title={collapsed ? user?.email : undefined}
              className={cn(
                'flex items-center gap-3 rounded-control py-2 transition-colors duration-fast ease-standard hover:bg-brand-50',
                collapsed ? 'justify-center px-0' : 'px-2.5',
              )}
            >
              <Avatar name={user?.email} size="sm" />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink" title={user?.email}>
                    {user?.email ?? 'Signed in'}
                  </span>
                  <span className="block text-[11px] text-ink-subtle">My profile</span>
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className={cn(
                'mt-1 flex w-full items-center gap-3 rounded-control py-2 text-xs font-medium text-ink-muted transition-colors duration-fast ease-standard hover:bg-critical-50 hover:text-critical-700',
                collapsed ? 'justify-center px-0' : 'px-2.5',
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

          {/* Below lg the rail is hidden, so the switcher and the same links
              run along the top rather than becoming unreachable. */}
          <div className="border-b border-line bg-surface lg:hidden">
            {workspaces.length > 1 && (
              <div className="border-b border-line px-4 py-2.5 sm:px-6">
                <WorkspaceSwitcher workspaces={workspaces} currentId={current.id} variant="bar" />
              </div>
            )}
            <nav className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors duration-fast ease-standard',
                      isActive
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                        : 'text-ink-muted hover:bg-line/40 hover:text-ink',
                    )
                  }
                >
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main
            className={cn(
              'mx-auto px-4 pt-6 transition-[max-width] duration-base ease-standard sm:px-6 lg:pt-8',
              'pb-[calc(var(--footer-h)+1.5rem)]',
              collapsed ? 'max-w-wide' : 'max-w-content',
            )}
          >
            <Outlet />
          </main>
        </div>

        <SiteFooter variant="inset" />
      </div>
    </ShellTitleProvider>
  );
}
