import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Workspace, WorkspaceId } from './workspaces';

/**
 * Moves a reader between the hats they hold. Both stay on screen with the
 * current one lit, so which hat you are wearing is never a thing you have to
 * remember — and switching back is always one click.
 */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
  variant,
}: {
  workspaces: Workspace[];
  currentId: WorkspaceId;
  /** `rail` stacks icon over label, `bar` runs inline, `collapsed` is icon only. */
  variant: 'rail' | 'bar' | 'collapsed';
}) {
  // One hat is not a choice.
  if (workspaces.length < 2) return null;

  const index = Math.max(
    0,
    workspaces.findIndex((w) => w.id === currentId),
  );

  if (variant === 'collapsed') {
    return (
      <nav aria-label="Workspace" className="space-y-1">
        {workspaces.map((w) => {
          const active = w.id === currentId;
          return (
            <Link
              key={w.id}
              to={w.home}
              title={`${w.label} — ${w.blurb}`}
              aria-label={`Switch to ${w.label}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-9 items-center justify-center rounded-control transition-all duration-fast ease-standard',
                active
                  ? 'bg-brand-gradient text-white shadow-brand'
                  : 'text-ink-subtle hover:bg-line/40 hover:text-ink',
              )}
            >
              <Icon name={w.icon} />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Workspace"
      className={cn(
        // Grid, not flex: equal columns are what lets the indicator below be
        // placed by arithmetic. Flex items will not shrink under a nowrap label.
        'relative grid auto-cols-fr grid-flow-col rounded-2xl bg-canvas-sunken p-1 ring-1 ring-inset ring-line',
      )}
    >
      {/* One pill slides between the hats rather than each lighting up on its
          own, so the switch reads as moving, not as two separate buttons. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-xl bg-brand-gradient shadow-brand transition-transform duration-base ease-standard motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${workspaces.length})`,
          transform: `translateX(calc(${index} * 100%))`,
        }}
      />
      {workspaces.map((w) => {
        const active = w.id === currentId;
        return (
          <Link
            key={w.id}
            to={w.home}
            title={w.blurb}
            aria-label={`Switch to ${w.label}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative z-10 flex items-center justify-center rounded-xl font-medium transition-colors duration-base ease-standard',
              variant === 'rail'
                ? 'flex-col gap-1 px-1 py-2 text-[11px]'
                : 'gap-1.5 whitespace-nowrap px-3.5 py-1.5 text-sm',
              active ? 'text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            <Icon name={w.icon} />
            {w.label}
          </Link>
        );
      })}
    </nav>
  );
}
