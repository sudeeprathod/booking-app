import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from '../pages/Login';
import { authService } from '../services/api';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../services/api');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderLogin() {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows admin hint', () => {
    renderLogin();
    expect(screen.getByText(/Admin:.*username/i)).toBeInTheDocument();
  });

  it('calls login API on submit', async () => {
    authService.login.mockResolvedValue({
      success: true,
      data: { token: 'jwt', user: { id: '1', username: 'admin', role: 'admin' } },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin', 'admin');
    });
  });

  it('shows error on login failure', async () => {
    authService.login.mockResolvedValue({ success: false, message: 'Invalid credentials' });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('toggles to register', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
  });
});
