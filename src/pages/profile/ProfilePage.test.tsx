import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, beforeEach } from 'vitest';
import { ProfilePage } from './ProfilePage';
import type { ProfileView } from '@/features/profiles/useProfiles';
import { useAuthStore } from '@/stores/authStore';

const interests = [{ id: 'i1', area: 'Robotics' }];

function view(over: Partial<ProfileView> & { role: string }): ProfileView {
  const { role, ...rest } = over;
  return {
    profile: {
      id: 'p1',
      userId: 'u1',
      headline: null,
      about: null,
      department: null,
      designation: null,
      contactEmail: null,
      links: null,
      interests,
      outputs: [],
      user: { id: 'u1', email: 'a@b.c', fullName: 'Alex Perera', role },
    },
    user: { id: 'u1', email: 'a@b.c', fullName: 'Alex Perera', role },
    supervisedProjects: [],
    ownProjects: [],
    ...rest,
  };
}

function renderProfile(data: ProfileView) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['profile', 'u1'], data);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/profile/u1']}>
        <Routes>
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const project = {
  title: 'Line follower',
  course: 'CO3554',
  academicYear: '2026',
  projectType: 'FYP',
  groupName: 'Group A',
};

describe('ProfilePage tabs', () => {
  beforeEach(() => useAuthStore.getState().reset());

  it('never offers a student a supervising tab', () => {
    // The old page rendered a fixed three-tab array, so every student had an
    // empty "Projects supervised" tab.
    renderProfile(view({ role: 'STUDENT', ownProjects: [{ ...project, supervisor: null }] }));

    expect(screen.getByRole('tab', { name: 'Projects done' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Projects supervised' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Skills and interests' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Research' })).toBeNull();
  });

  it('labels a lecturer the way a lecturer expects', () => {
    renderProfile(
      view({ role: 'LECTURER', supervisedProjects: [{ ...project, students: [{ studentId: 'EG1', fullName: 'Sam' }] }] }),
    );

    expect(screen.getByRole('tab', { name: 'Projects supervised' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Research' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Projects done' })).toBeNull();
  });

  it('hides a tab with nothing in it rather than showing it blank', () => {
    renderProfile(view({ role: 'STUDENT' }));

    // Only interests are filled in, so that is the only tab — and with one tab
    // there is no choice to make, so no tab bar at all.
    expect(screen.queryByRole('tab', { name: 'Projects done' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'About' })).toBeNull();
    expect(screen.getByText('Robotics')).toBeInTheDocument();
  });

  it('says so plainly when a profile is empty', () => {
    const empty = view({ role: 'STUDENT' });
    empty.profile!.interests = [];
    renderProfile(empty);

    expect(screen.getByText(/this profile is empty/i)).toBeInTheDocument();
  });
});
