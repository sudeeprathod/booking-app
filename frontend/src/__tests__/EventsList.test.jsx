import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import EventsList from '../pages/EventsList';
import { eventService } from '../services/api';

vi.mock('../services/api');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderEventsList() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventsList />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('EventsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading then events', async () => {
    eventService.getEvents.mockResolvedValue({
      success: true,
      data: [
        { eventId: '1', name: 'Concert A', totalSeats: 100, availableSeats: 50, soldOut: false },
        { eventId: '2', name: 'Show B', totalSeats: 20, availableSeats: 0, soldOut: true },
      ],
    });
    renderEventsList();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await screen.findByText('Concert A');
    expect(screen.getByText('Show B')).toBeInTheDocument();
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.getAllByText('Available').length).toBeGreaterThan(0);
  });

  it('shows empty state when no events', async () => {
    eventService.getEvents.mockResolvedValue({ success: true, data: [] });
    renderEventsList();
    await screen.findByText(/no events yet/i);
  });
});
