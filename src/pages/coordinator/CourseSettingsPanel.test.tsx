import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CourseSettingsPanel } from './CourseSettingsPanel';
import { policyKey, type CpiPolicy } from '@/features/policy/usePolicy';
import { cpiDetailKey } from '@/features/courses/useCpiDetail';
import type { CpiDetail } from '@/features/courses/types';

const patch = vi.fn();
const post = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    patch: (...args: unknown[]) => {
      patch(...args);
      return Promise.resolve({ data: {} });
    },
    post: (...args: unknown[]) => {
      post(...args);
      return Promise.resolve({ data: {} });
    },
  },
}));

const policy = {
  allowStudentIdeas: true,
  studentIdeasLeaderOnly: true,
  allowSupervisorIdeas: true,
  allowCoordinatorIdeas: false,
  allowLecturerIdeas: false,
  requireStudentIdeaApproval: false,
  maxIdeasPerGroup: null,
  allowCoSupervisorOnIdea: true,
  interestEnabled: true,
  maxInterestsPerGroup: null,
  allowInterestWithdrawal: true,
  allowLecturerInterestInGroupIdeas: false,
  allowCoSupervisionInterest: false,
  studentsSeeOtherGroupIdeas: false,
  allowSupervisorSelfRequest: true,
  selectionConfirmedBy: 'SUPERVISOR',
  allowIndividualParticipation: false,
  autoCreateSoloGroup: false,
  headJudgeEnabled: false,
  requireOverallComment: true,
  availabilityRequiredFrom: 'EVALUATORS_ONLY',
  gradingEnabled: true,
  caContributionPercent: null,
  passMarkPercent: null,
  targetGroupSize: null,
} satisfies CpiPolicy;

// Ideas is open today; every other phase sits in the past.
const cpi = {
  id: 'cpi-1',
  mode: 'SUPERVISOR_LED',
  timeline: [
    { id: '1', phase: 'IDEA_ANNOUNCEMENT', startDate: '2000-01-01', endDate: '2999-01-01' },
    { id: '2', phase: 'PROJECT_SELECTION', startDate: '2000-01-01', endDate: '2000-01-02' },
  ],
} as unknown as CpiDetail;

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(policyKey('cpi-1'), policy);
  client.setQueryData(cpiDetailKey('cpi-1'), cpi);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CourseSettingsPanel cpiId="cpi-1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CourseSettingsPanel', () => {
  beforeEach(() => {
    patch.mockClear();
    post.mockClear();
  });

  it('opens the group whose phase is running and folds the rest', () => {
    renderPanel();
    // Ideas is open, so its settings are visible without a click.
    expect(screen.getByLabelText(/only the group leader/i)).toBeInTheDocument();
    expect(screen.getByText(/this phase is open/i)).toBeInTheDocument();
    // Selection has closed, so its settings stay folded away.
    expect(screen.queryByLabelText(/lecturers may ask to join this course/i)).toBeNull();
    expect(screen.getByRole('button', { name: /Selection/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a folded group when its heading is clicked', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /Selection/ }));
    expect(screen.getByLabelText(/lecturers may ask to join this course/i)).toBeInTheDocument();
  });

  it('names what a preset will change before applying it', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /Coordinator-managed/i }));

    expect(screen.getByText(/The coordinator posts ideas/)).toBeInTheDocument();
    expect(screen.getByText(/Interest is turned off/)).toBeInTheDocument();
    // Naming the effects is not applying them.
    expect(post).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Apply preset/i }));
    expect(post).toHaveBeenCalledWith('/courses/cpi-1/preset', { mode: 'COORDINATOR_MANAGED' });
  });

  it('saves a toggle as soon as it changes', async () => {
    renderPanel();
    await userEvent.click(screen.getByLabelText(/only the group leader/i));
    expect(patch).toHaveBeenCalledWith('/courses/cpi-1/policy', { studentIdeasLeaderOnly: false });
  });

  it('saves a number setting on blur rather than per keystroke', async () => {
    renderPanel();
    const input = screen.getByLabelText(/ideas per group/i);
    await userEvent.type(input, '10');
    // Typing "10" must not first save a limit of 1.
    expect(patch).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledWith('/courses/cpi-1/policy', { maxIdeasPerGroup: 10 });
  });

  // caContributionPercent had no control anywhere before this panel, so the
  // student marks page could never show what a project contributes.
  it('saves the module contribution', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /^Results/ }));
    const input = screen.getByLabelText(/contribution to the module/i);
    await userEvent.type(input, '40');
    await userEvent.tab();
    expect(patch).toHaveBeenCalledWith('/courses/cpi-1/policy', { caContributionPercent: 40 });
  });
});
