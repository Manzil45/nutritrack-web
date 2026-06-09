// src/tests/LoginFull.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

// Mock the auth API module to match the ACTUAL export shape: { authApi: { login, signup, logout } }
vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { authApi } from '../api/auth';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Helper: the email placeholder is "hello@example.com" and password is "••••••••"
  const getEmailInput = () => screen.getByPlaceholderText('hello@example.com');
  const getPasswordInput = () => screen.getByPlaceholderText('••••••••');
  // The submit button says "Log In" (with arrow icon), but there's also a "Log in" toggle button.
  // We target the submit button specifically by its type="submit" attribute.
  const getLoginButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.getAttribute('type') === 'submit');
  };

  // ======================================
  // FORM RENDERING
  // ======================================

  it('renders login form dengan email dan password input', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getLoginButton()).toBeInTheDocument();
  });

  it('renders link ke signup page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
  });

  // ======================================
  // FORM VALIDATION
  // ======================================

  it('form validation: email field required', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Component checks if(!email || !password) and sets error, does NOT call API
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('form validation: password field required', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'test@test.com');
    await user.click(loginButton);

    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('form validation: shows error when fields empty', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const loginButton = getLoginButton();
    await user.click(loginButton);

    // The component sets error to 'Please fill all fields'
    await waitFor(() => {
      expect(screen.getByText(/Please fill all fields/i)).toBeInTheDocument();
    });
  });

  // ======================================
  // LOGIN SUCCESS
  // ======================================

  it('successful login: calls authApi.login dengan correct data', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValueOnce({
      user: { _id: 'user_id', email: 'test@test.com' },
      token: 'test_token',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('successful login: redirect to dashboard', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValueOnce({
      user: { _id: 'user_id', email: 'test@test.com' },
      token: 'test_token',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('successful login: saves token to localStorage', async () => {
    const user = userEvent.setup();
    // authApi.login calls the real API which sets localStorage internally,
    // but since we mock it, we need to simulate that behavior
    authApi.login.mockImplementation(async () => {
      localStorage.setItem('token', 'test_token');
      return {
        user: { _id: 'user_id', email: 'test@test.com' },
        token: 'test_token',
      };
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test_token');
    });
  });

  // ======================================
  // LOGIN FAILURE
  // ======================================

  it('failed login: shows error message untuk invalid credentials', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValueOnce(new Error('Login failed'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'wrong@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });

  it('failed login: tidak redirect to dashboard', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValueOnce(new Error('Login failed'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'wrong@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
  });

  // ======================================
  // LOADING STATE
  // ======================================

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    authApi.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = getEmailInput();
    const passwordInput = getPasswordInput();
    const loginButton = getLoginButton();

    await user.type(emailInput, 'test@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(loginButton);

    // Button should be disabled and show "Logging In..." text
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });
  });
});
