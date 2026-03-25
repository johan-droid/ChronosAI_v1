import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import OAuthRedirect from '../pages/OAuthRedirect';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

test('OAuthRedirect sets token and routes to dashboard', async () => {
  api.get = vi.fn().mockResolvedValue({ data: { _id: '1', name: 'Test User', email: 't@t.com' } });

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/oauth2/redirect?token=test-token']}>
        <Routes>
          <Route path="/oauth2/redirect" element={<OAuthRedirect />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

  expect(screen.getByText(/google sign-in/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  expect(api.get).toHaveBeenCalledWith('/auth/me', { headers: { Authorization: 'Bearer test-token' } });
});
