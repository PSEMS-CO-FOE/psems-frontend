import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useLogin } from './useLogin';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types/auth';

function Harness({ role }: { role: Role }) {
  const login = useLogin();
  return (
    <button onClick={() => login.mutate({ email: 'a@b.c', password: 'x' })}>
      Sign in as {role}
    </button>
  );
}

function Landed() {
  return <p>landed on {useLocation().pathname}</p>;
}

function renderLogin({ from, role }: { from: string; role: Role }) {
  vi.spyOn(api, 'post').mockResolvedValue({
    data: {
      accessToken: 't',
      forcePasswordChange: false,
      user: { id: 'u1', email: 'a@b.c', role },
    },
  } as never);

  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: from } } }]}>
        <Routes>
          <Route path="/login" element={<Harness role={role} />} />
          <Route path="*" element={<Landed />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('where signing in lands you', () => {
  beforeEach(() => useAuthStore.getState().reset());
  afterEach(() => vi.restoreAllMocks());

  it('returns you to the page you were sent away from', async () => {
    const user = userEvent.setup();
    renderLogin({ from: '/coordinator/abc/marks', role: 'COURSE_COORDINATOR' });

    await user.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(screen.getByText('landed on /coordinator/abc/marks')).toBeInTheDocument(),
    );
  });

  // The page is remembered per tab, not per person. Signing a different account
  // in on the same tab used to drop them on the previous account's screen.
  it('ignores a remembered page that belongs to another role', async () => {
    const user = userEvent.setup();
    renderLogin({ from: '/coordinator/abc/marks', role: 'STUDENT' });

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('landed on /')).toBeInTheDocument());
  });

  it('still follows a page that belongs to no section', async () => {
    const user = userEvent.setup();
    renderLogin({ from: '/directory', role: 'STUDENT' });

    await user.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('landed on /directory')).toBeInTheDocument());
  });
});
