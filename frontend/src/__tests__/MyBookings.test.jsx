import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import MyBookings from '../pages/MyBookings';
import { eventService } from '../services/api';

vi.mock('../services/api');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderMyBookings() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MyBookings />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MyBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('shows loading then bookings', async () => {
    eventService.getMyBookings.mockResolvedValue({
      success: true,
      data: [
        { bookingId: 'b1', eventId: 'e1', eventName: 'Concert A', seats: 2, date: '2024-01-01' },
      ],
    });
    renderMyBookings();
    await screen.findByText('Concert A');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows empty when no bookings', async () => {
    eventService.getMyBookings.mockResolvedValue({ success: true, data: [] });
    renderMyBookings();
    await screen.findByText(/no active bookings/i);
  });

  it('calls cancel API when cancel clicked', async () => {
    eventService.getMyBookings.mockResolvedValue({
      success: true,
      data: [
        { bookingId: 'b1', eventId: 'e1', eventName: 'Concert A', seats: 2, date: '2024-01-01' },
      ],
    });
    eventService.cancelBooking.mockResolvedValue({ success: true });
    renderMyBookings();
    await screen.findByText('Concert A');
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(eventService.cancelBooking).toHaveBeenCalledWith('e1', 'b1');
    });
  });
});
