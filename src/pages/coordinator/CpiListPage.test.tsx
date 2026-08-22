import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CpiListPage } from './CpiListPage';

function renderWith(batches: string[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['courses'], []);
  client.setQueryData(['courses', 'batches'], batches);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CpiListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Creating a course', () => {
  it('suggests the batches the department already uses', () => {
    renderWith(['21ENG', '22ENG']);

    const input = screen.getByLabelText(/batch/i);
    const list = document.getElementById(input.getAttribute('list')!);
    // Suggested rather than validated: a fixed pattern would block a special or
    // repeat intake, which is why project type is free text too.
    expect(list).not.toBeNull();
    expect(optionsIn(list!).length).toBe(2);
  });

  it('says the batch decides who sees the course', () => {
    renderWith([]);
    expect(screen.getByText(/Only students in this batch will see the course/)).toBeInTheDocument();
  });

  it('will not submit without a batch', async () => {
    const user = userEvent.setup();
    renderWith([]);

    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(await screen.findByText(/Batch is required/)).toBeInTheDocument();
  });
});

// datalist options are not accessible nodes, so they are counted directly.
function optionsIn(list: HTMLElement) {
  return list.querySelectorAll('option');
}
