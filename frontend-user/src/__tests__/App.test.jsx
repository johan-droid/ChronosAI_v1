import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PortalSelection from '../pages/PortalSelection';
import Login from '../pages/Login';

test('should navigate from portal selection to login page', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<PortalSelection />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

  expect(screen.getByRole('heading', { name: /chronosai/i })).toBeInTheDocument();

  const userPortalBtn = screen.getByRole('button', { name: /user portal/i });
  await user.click(userPortalBtn);

  expect(await screen.findByText(/sign in to manage your meetings/i)).toBeInTheDocument();
});
