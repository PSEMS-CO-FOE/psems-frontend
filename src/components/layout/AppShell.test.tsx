import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeEach } from 'vitest';
import { AppShell } from './AppShell';
import { workspacesFor } from './workspaces';
import { PageHeader } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

function renderShell(page = <p>page body</p>, role: 'LECTURER' | 'COURSE_COORDINATOR' = 'LECTURER') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/lecturer']}>
        <Routes>
          <Route
            path="/lecturer"
            element={
              <AppShell
                roleLabel="Lecturer"
                workspaces={workspacesFor(role)}
                currentId="supervising"
              />
            }
          >
            <Route index element={page} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    useAuthStore.getState().setSession({
      accessToken: 'test',
      user: { id: 'u1', email: 'lecturer1@psems.dev', role: 'LECTURER' },
      forcePasswordChange: false,
    });
    useThemeStore.setState({ preference: 'system' });
  });

  it('renders the signed-in user and the routed page', () => {
    renderShell();
    expect(screen.getByText('lecturer1@psems.dev')).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();
  });

  // Below the sidebar's breakpoint the same links move into the top bar, so
  // every nav item is rendered twice on purpose.
  it('keeps every nav link reachable in both the rail and the top bar', () => {
    renderShell();
    expect(screen.getAllByRole('link', { name: 'My courses' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Find courses' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Directory' })).toHaveLength(2);
  });

  it('marks the current route as the active nav item', () => {
    renderShell();
    const [current] = screen.getAllByRole('link', { name: 'My courses' });
    expect(current).toHaveClass('bg-brand-50');
  });

  it('offers a log out control and a route to the profile', () => {
    renderShell();
    expect(screen.getAllByRole('button', { name: 'Log out' }).length).toBeGreaterThan(0);
    const profile = screen.getByRole('link', { name: /My profile/ });
    expect(within(profile).getByText('lecturer1@psems.dev')).toBeInTheDocument();
  });

  describe('top bar title', () => {
    it('falls back to the role when the page names nothing', () => {
      renderShell();
      // Once in the rail under the wordmark, once as the top bar's fallback.
      expect(screen.getAllByText('Lecturer')).toHaveLength(2);
    });

    it("shows the page's own title once a PageHeader sets one", async () => {
      renderShell(<PageHeader title="Availability" />);
      expect(await screen.findAllByText('Availability')).toHaveLength(2);
      expect(screen.getAllByText('Lecturer')).toHaveLength(1);
    });
  });

  describe('sidebar collapse', () => {
    it('collapses, hides the labels in the rail and remembers the choice', async () => {
      const user = userEvent.setup();
      renderShell();

      await user.click(screen.getByRole('button', { name: 'Collapse the sidebar' }));

      // The visible label goes, but the link keeps its accessible name from the
      // title attribute — an icon-only rail must not become an unlabelled one.
      const [railLink] = screen.getAllByRole('link', { name: 'My courses' });
      expect(railLink).not.toHaveTextContent('My courses');
      expect(railLink).toHaveAttribute('title', 'My courses');

      expect(localStorage.getItem('psems-sidebar-collapsed')).toBe('1');
      expect(screen.getByRole('button', { name: 'Expand the sidebar' })).toBeInTheDocument();
    });
  });

  describe('theme toggle', () => {
    it('cycles light, dark, then back to following the system', async () => {
      const user = userEvent.setup();
      renderShell();

      const toggle = () => screen.getByRole('button', { name: /theme/i });

      await user.click(toggle());
      expect(useThemeStore.getState().preference).toBe('light');
      expect(document.documentElement).not.toHaveClass('dark');

      await user.click(toggle());
      expect(useThemeStore.getState().preference).toBe('dark');
      expect(document.documentElement).toHaveClass('dark');

      await user.click(toggle());
      expect(useThemeStore.getState().preference).toBe('system');
      expect(localStorage.getItem('psems-theme')).toBe('system');
    });
  });

  describe('workspace switcher', () => {
    it('stays out of the way of a reader who holds one workspace', () => {
      renderShell();
      expect(screen.queryByRole('navigation', { name: 'Workspace' })).not.toBeInTheDocument();
    });

    // A promoted lecturer keeps supervising, so both hats need to be on screen
    // and the one they are not wearing has to lead somewhere.
    it('offers a coordinator both hats and marks the one in use', () => {
      renderShell(<p>page body</p>, 'COURSE_COORDINATOR');

      const [rail] = screen.getAllByRole('navigation', { name: 'Workspace' });
      const supervising = within(rail).getByRole('link', { name: 'Switch to Supervising' });
      const coordinating = within(rail).getByRole('link', { name: 'Switch to Coordinating' });

      expect(supervising).toHaveAttribute('aria-current', 'page');
      expect(coordinating).not.toHaveAttribute('aria-current');
      expect(coordinating).toHaveAttribute('href', '/coordinator');
    });

    it('keeps the switcher reachable once the rail is collapsed', async () => {
      const user = userEvent.setup();
      renderShell(<p>page body</p>, 'COURSE_COORDINATOR');

      await user.click(screen.getByRole('button', { name: 'Collapse the sidebar' }));

      const [rail] = screen.getAllByRole('navigation', { name: 'Workspace' });
      expect(within(rail).getByRole('link', { name: 'Switch to Coordinating' })).toHaveAttribute(
        'href',
        '/coordinator',
      );
    });
  });
});
