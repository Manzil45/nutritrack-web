import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login';

// ======================================
// MOCK
// ======================================

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ======================================
// HELPER
// ======================================

const renderLogin = () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
};

// Submit button adalah button kedua karena ada 2 button "Log in"
// (toggle Login/Signup dan submit form)
const clickSubmit = () => {
  fireEvent.click(screen.getAllByRole('button', { name: /log in/i })[1]);
};

// ======================================
// TESTING
// ======================================

describe('Login Page Testing', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render', () => {

    test('Halaman login tampil dengan benar', () => {
      renderLogin();

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('hello@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /log in/i })[1]).toBeInTheDocument();
    });

    test('Link ke signup tersedia', () => {
      renderLogin();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

  });

  describe('Validasi', () => {

    test('Error muncul jika email kosong', async () => {
      renderLogin();
      clickSubmit();

      await waitFor(() => {
        expect(screen.getByText('Please fill all fields')).toBeInTheDocument();
      });
    });

    test('Error muncul jika password kosong', async () => {
      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
        target: { value: 'test@gmail.com' },
      });
      clickSubmit();

      await waitFor(() => {
        expect(screen.getByText('Please fill all fields')).toBeInTheDocument();
      });
    });

  });

  describe('Login Berhasil', () => {

    test('Redirect ke /dashboard setelah login berhasil', async () => {
      const { authApi } = await import('../api/auth');
      authApi.login.mockResolvedValue({
        user: { name: 'Testing', email: 'test@gmail.com' },
        token: 'faketoken123',
      });

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
        target: { value: 'test@gmail.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: '123456' },
      });
      clickSubmit();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('Tombol loading saat proses login', async () => {
      const { authApi } = await import('../api/auth');
      authApi.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
        target: { value: 'test@gmail.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: '123456' },
      });
      clickSubmit();

      await waitFor(() => {
        expect(screen.getByText('Logging In...')).toBeInTheDocument();
      });
    });

  });

  describe('Login Gagal', () => {

    test('Error muncul jika login gagal', async () => {
      const { authApi } = await import('../api/auth');
      authApi.login.mockRejectedValue(new Error('Invalid credentials'));

      renderLogin();

      fireEvent.change(screen.getByPlaceholderText('hello@example.com'), {
        target: { value: 'salah@gmail.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'wrongpassword' },
      });
      clickSubmit();

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

  });

});