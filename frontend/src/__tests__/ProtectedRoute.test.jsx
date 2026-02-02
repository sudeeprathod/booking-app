import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock useAuth - no token
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    token: null,
    loading: false,
  }),
}));

describe('ProtectedRoute', () => {
  it('redirects to login when no token', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={(
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            )}
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
