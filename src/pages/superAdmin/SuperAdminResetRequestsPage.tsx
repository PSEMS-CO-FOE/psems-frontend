import {
  useDismissResetRequest,
  usePasswordResetRequests,
  useResetUserPassword,
} from '@/features/superAdmin/useSuperAdmin';
import { getApiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, EmptyState, Notice, PageHeader, SkeletonCard } from '@/components/ui';
import { OneTimePassword } from './OneTimePassword';

export function SuperAdminResetRequestsPage() {
  const { data: requests, isLoading, isError, error } = usePasswordResetRequests('PENDING');
  const resetPassword = useResetUserPassword();
  const dismiss = useDismissResetRequest();

  const actionError = resetPassword.error ?? dismiss.error ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Password requests"
        description="Anyone locked out can ask for a reset from the sign-in page. Resetting the account closes its request."
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

      {isLoading && <SkeletonCard rows={3} />}
      {isError && (
        <Notice tone="critical">{getApiErrorMessage(error, 'Could not load requests')}</Notice>
      )}

      {requests && requests.length === 0 && (
        <EmptyState
          title="Nothing waiting"
          hint="Requests appear here as soon as someone asks for a reset from the sign-in page."
        />
      )}

      {requests && requests.length > 0 && (
        <Card title="Waiting" description={`${requests.length} open.`}>
          <ul className="divide-y divide-line">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{request.email}</p>
                  {request.note && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">“{request.note}”</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* No account means the address was mistyped, or belongs to a
                    different system. Resetting is impossible, so only dismissing
                    is offered — and the row stays visible rather than vanishing. */}
                {request.user ? (
                  <Badge tone={request.user.suspendedAt ? 'critical' : 'neutral'}>
                    {request.user.suspendedAt
                      ? 'Suspended'
                      : request.user.role.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                ) : (
                  <Badge tone="caution">No such account</Badge>
                )}

                <div className="flex gap-2">
                  {request.user && (
                    <Button
                      size="sm"
                      onClick={() => resetPassword.mutate(request.user!.id)}
                      disabled={resetPassword.isPending}
                    >
                      Reset password
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => dismiss.mutate(request.id)}>
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
