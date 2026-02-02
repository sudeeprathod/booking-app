import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CreateEvent from '../pages/CreateEvent';
import { eventService } from '../services/api';

vi.mock('../services/api');

describe('CreateEvent', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CreateEvent />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render create event form', () => {
    renderComponent();
    expect(screen.getByText(/Create Event.*Admin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total seats/i)).toBeInTheDocument();
  });

  it('should create event successfully', async () => {
    const mockResponse = {
      success: true,
      data: {
        eventId: '123',
        name: 'Concert A',
        totalSeats: 100,
        availableSeats: 100,
      },
    };

    eventService.createEvent.mockResolvedValue(mockResponse);

    renderComponent();

    const nameInput = screen.getByLabelText(/event name/i);
    const seatsInput = screen.getByLabelText(/total seats/i);
    const submitButton = screen.getByRole('button', { name: /create event/i });

    await userEvent.type(nameInput, 'Concert A');
    await userEvent.type(seatsInput, '100');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(eventService.createEvent).toHaveBeenCalledWith({
        name: 'Concert A',
        totalSeats: 100,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/event created/i)).toBeInTheDocument();
    });
  });

  it('should display error on failure', async () => {
    eventService.createEvent.mockRejectedValue({
      response: {
        data: {
          message: 'Error creating event',
        },
      },
    });

    renderComponent();

    const nameInput = screen.getByLabelText(/event name/i);
    const seatsInput = screen.getByLabelText(/total seats/i);
    const submitButton = screen.getByRole('button', { name: /create event/i });

    await userEvent.type(nameInput, 'Concert A');
    await userEvent.type(seatsInput, '100');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error creating event/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(submitButton);

    expect(screen.getByLabelText(/event name/i)).toBeRequired();
    expect(screen.getByLabelText(/total seats/i)).toBeRequired();
  });
});
