import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EnterCpiPage } from './EnterCpiPage';
import type { OtherBatchCpi, StudentCpi } from '@/features/courses/useCourses';

function renderWith(courses: StudentCpi[], others: OtherBatchCpi[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['courses', 'mine', 'student'], courses);
  client.setQueryData(['courses', 'other-batches'], others);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EnterCpiPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const active: StudentCpi = {
  id: 'c1',
  name: 'Data Management Project',
  department: 'Computer Engineering',
  batch: '22ENG',
  status: 'ACTIVE',
  academicYear: '2026/2027',
  projectType: 'Data Management Project',
};

const archived: StudentCpi = {
  ...active,
  id: 'c2',
  name: 'Software Engineering Project',
  status: 'ARCHIVED',
};

describe('EnterCpiPage', () => {
  it('separates current courses from past ones', () => {
    renderWith([active, archived]);

    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
    // A finished course stays readable but is marked as done.
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('does not split the list when every course is current', () => {
    renderWith([active]);

    // One heading for two groups would be noise when there is only one group.
    expect(screen.queryByText('Current')).not.toBeInTheDocument();
    expect(screen.queryByText('Past')).not.toBeInTheDocument();
    expect(screen.getByText('Data Management Project')).toBeInTheDocument();
  });

  it('shows the batch on each course', () => {
    renderWith([active]);
    expect(screen.getByText(/22ENG/)).toBeInTheDocument();
  });

  it('offers another batch’s course to ask for, without showing its contents', () => {
    renderWith(
      [active],
      [
        {
          id: 'c9',
          name: 'Data Management Project',
          batch: '23ENG',
          projectType: 'Data Management Project',
          academicYear: '2027/2028',
          request: null,
        },
      ],
    );

    expect(screen.getByText(/Taking a course with another batch/)).toBeInTheDocument();
  });

  it('says nothing is open rather than showing an empty list', () => {
    renderWith([]);
    expect(screen.getByText(/No courses open to you yet/)).toBeInTheDocument();
  });
});
