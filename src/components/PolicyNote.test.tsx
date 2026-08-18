import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeEach } from 'vitest';
import { PolicyNote } from './PolicyNote';
import { policyKey, type CpiPolicy } from '@/features/policy/usePolicy';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types/auth';

const policy = {
  studentIdeasLeaderOnly: true,
  requireStudentIdeaApproval: false,
} as CpiPolicy;

function renderNote(lines: (p: CpiPolicy) => (string | false | null | undefined)[], role: Role = 'STUDENT') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Seed the cache directly rather than mocking the transport: the component's
  // only job is turning a policy into sentences.
  client.setQueryData(policyKey('cpi-1'), policy);
  useAuthStore.getState().setSession({
    accessToken: 't',
    user: { id: 'u1', email: 'a@b.c', role },
    forcePasswordChange: false,
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PolicyNote cpiId="cpi-1" lines={lines} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PolicyNote', () => {
  beforeEach(() => useAuthStore.getState().reset());

  it('states the settings that govern the screen', () => {
    renderNote((p) => [p.studentIdeasLeaderOnly && 'Only your group leader can post.']);
    expect(screen.getByText('Only your group leader can post.')).toBeInTheDocument();
  });

  it('renders nothing when no line applies', () => {
    // A screen with nothing worth saying shows no box at all, rather than an
    // empty heading.
    const { container } = renderNote((p) => [p.requireStudentIdeaApproval && 'Ideas need approval.']);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers the change link only to a coordinator', () => {
    renderNote(() => ['Something is set.'], 'STUDENT');
    expect(screen.queryByRole('link', { name: /change in course settings/i })).toBeNull();
  });

  it('links a coordinator to the settings route', () => {
    renderNote(() => ['Something is set.'], 'COURSE_COORDINATOR');
    expect(screen.getByRole('link', { name: /change in course settings/i })).toHaveAttribute(
      'href',
      '/coordinator/cpi-1/setup',
    );
  });
});
