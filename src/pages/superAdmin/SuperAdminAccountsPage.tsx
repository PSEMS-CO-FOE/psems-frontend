import { useState } from 'react';
import {
  useDeleteUser,
  useManagedUsers,
  useReinstateUser,
  useResetUserPassword,
  useSuspendUser,
  type ManagedUser,
} from '@/features/superAdmin/useSuperAdmin';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/apiError';
import { useDebounced } from '@/lib/useDebounced';
import { Badge, Button, Card, EmptyState, Field, Notice, PageHeader, SkeletonCard } from '@/components/ui';
import { OneTimePassword } from './OneTimePassword';

export function SuperAdminAccountsPage() {
  const [search, setSearch] = useState('');
  const query = useDebounced(search, 250);
  const { data: users, isLoading, isError, error } = useManagedUsers(query);

  const me = useAuthStore((s) => s.user);
  const suspend = useSuspendUser();
  const reinstate = useReinstateUser();
  const resetPassword = useResetUserPassword();
  const remove = useDeleteUser();

  const actionError =
    suspend.error ?? reinstate.error ?? resetPassword.error ?? remove.error ?? null;

  function onSuspend(user: ManagedUser) {
    // A reason is required by the API, and whoever reinstates the account reads
    // it, so it is asked for rather than defaulted.
    const reason = window.prompt(`Why is ${user.email} being suspended?`)?.trim();
    if (reason) suspend.mutate({ userId: user.id, reason });
  }

  function onDelete(user: ManagedUser) {
    if (window.confirm(`Permanently delete ${user.email}? This cannot be undone.`)) {
      remove.mutate(user.id);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Every account in the system. Suspending keeps the person's record intact; deleting is refused once they have taken part in anything."
      />

      {resetPassword.isSuccess && (
        <OneTimePassword
          email={resetPassword.data.user.email}
          password={resetPassword.data.tempPassword}
        />
      )}

      {actionError && (
        <Notice tone="critical">{getApiErrorMessage(actionError, 'That action failed')}</Notice>
      )}

      <Card flush>
        <div className="p-4">
          <Field
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && <SkeletonCard rows={4} className="m-4" />}
        {isError && (
          <Notice tone="critical" className="m-4">
            {getApiErrorMessage(error, 'Could not load accounts')}
          </Notice>
        )}

        {users && users.length === 0 && (
          <EmptyState
            density="compact"
            title={query ? `Nobody matches “${query}”` : 'No accounts yet'}
            hint={query ? 'Try part of an email address instead.' : undefined}
            className="m-4"
          />
        )}

        {users && users.length > 0 && (
          <ul className="divide-y divide-line">
            {users.map((user) => {
              const isMe = user.id === me?.id;
              return (
                <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user.fullName || user.email}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    {user.suspendedReason && (
                      <p className="mt-0.5 truncate text-xs text-critical-700">
                        Suspended: {user.suspendedReason}
                      </p>
                    )}
                  </div>

                  <Badge tone={user.suspendedAt ? 'critical' : 'neutral'}>
                    {user.suspendedAt ? 'Suspended' : user.role.replace(/_/g, ' ').toLowerCase()}
                  </Badge>

                  {/* Acting on your own account here is refused by the API — the
                      last Super Admin must not be able to lock themselves out. */}
                  {!isMe && (
                    <div className="flex flex-wrap gap-2">
                      {user.suspendedAt ? (
                        <Button size="sm" variant="secondary" onClick={() => reinstate.mutate(user.id)}>
                          Reinstate
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => onSuspend(user)}>
                          Suspend
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => resetPassword.mutate(user.id)}>
                        Reset password
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onDelete(user)}>
                        Delete
                      </Button>
                    </div>
                  )}
                  {isMe && <span className="text-xs text-ink-subtle">This is you</span>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
