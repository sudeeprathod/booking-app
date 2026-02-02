import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('App', () => {
  beforeEach(() => {
    localStorage.removeItem('booking_token');
    localStorage.removeItem('booking_user');
  });

  it('shows login when not authenticated', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/']}>
            <App />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });
});
