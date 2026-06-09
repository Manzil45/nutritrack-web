// src/tests/ProfileFull.test.jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';

// ── Mocks ──────────────────────────────────────────────

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockTogglePreference = vi.fn();

vi.mock('../api/profile', () => ({
  profileApi: {
    getProfile: (...args) => mockGetProfile(...args),
    updateProfile: (...args) => mockUpdateProfile(...args),
    togglePreference: (...args) => mockTogglePreference(...args),
  },
}));

vi.mock('../utils/toast', () => ({
  toast: vi.fn(),
}));

vi.mock('../components/Shimmer', () => ({
  ProfileShimmer: () => <div data-testid="profile-shimmer">Loading...</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helpers ────────────────────────────────────────────

const mockProfileData = {
  name: 'Test User',
  description: 'Health enthusiast',
  avatar: 'https://example.com/avatar.jpg',
  dailyGoal: 2000,
  goalProgress: 65,
  preferences: {
    darkMode: false,
    emailNotifications: true,
    appleHealthSync: false,
    language: 'English (US)',
  },
};

function renderProfile() {
  return render(
    <BrowserRouter>
      <Profile />
    </BrowserRouter>,
  );
}

async function renderAndWait() {
  renderProfile();
  await waitFor(() => {
    expect(screen.queryByTestId('profile-shimmer')).not.toBeInTheDocument();
  });
}

// ── Tests ──────────────────────────────────────────────

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({ ...mockProfileData });
    mockUpdateProfile.mockResolvedValue({});
    mockTogglePreference.mockResolvedValue({});
  });

  // 1
  it('renders profile shimmer while loading', () => {
    mockGetProfile.mockImplementation(() => new Promise(() => {})); // never resolves
    renderProfile();
    expect(screen.getByTestId('profile-shimmer')).toBeInTheDocument();
  });

  // 2
  it('calls getProfile on mount', async () => {
    renderProfile();
    await waitFor(() => {
      expect(mockGetProfile).toHaveBeenCalledTimes(1);
    });
  });

  // 3
  it('displays user name after loading', async () => {
    await renderAndWait();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  // 4
  it('displays user description/bio after loading', async () => {
    await renderAndWait();
    expect(screen.getByText('Health enthusiast')).toBeInTheDocument();
  });

  // 5
  it('displays user avatar image', async () => {
    await renderAndWait();
    const img = screen.getByAltText('User Profile');
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  // 6
  it("displays avatar with correct alt text ('User Profile')", async () => {
    await renderAndWait();
    expect(screen.getByAltText('User Profile')).toBeInTheDocument();
  });

  // 7
  it('displays daily calorie goal', async () => {
    await renderAndWait();
    // toLocaleString for 2000 -> "2,000" or "2000" depending on locale
    expect(screen.getByText(/2[,.]?000/)).toBeInTheDocument();
  });

  // 8
  it("displays 'Kcal' label", async () => {
    await renderAndWait();
    expect(screen.getByText('Kcal')).toBeInTheDocument();
  });

  // 9
  it('displays goal progress bar', async () => {
    await renderAndWait();
    // The progress bar is a div with style width = 65%
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toBeTruthy();
    expect(progressBar.style.width).toBe('65%');
  });

  // 10
  it("displays 'Adjust Goal' button", async () => {
    await renderAndWait();
    expect(screen.getByRole('button', { name: /adjust goal/i })).toBeInTheDocument();
  });

  // 11
  it("displays 'Interface Theme' section title", async () => {
    await renderAndWait();
    expect(screen.getByText('Interface Theme')).toBeInTheDocument();
  });

  // 12
  it('displays Light/Dark toggle buttons', async () => {
    await renderAndWait();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  // 13
  it("displays 'Email Notifications' preference", async () => {
    await renderAndWait();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
  });

  // 14
  it("displays 'Display Language' preference with language value", async () => {
    await renderAndWait();
    expect(screen.getByText('Display Language')).toBeInTheDocument();
    expect(screen.getByText('English (US)')).toBeInTheDocument();
  });

  // 15
  it("displays 'Apple Health Sync' preference", async () => {
    await renderAndWait();
    expect(screen.getByText('Apple Health Sync')).toBeInTheDocument();
  });

  // 16
  it("displays 'Privacy & Data' preference", async () => {
    await renderAndWait();
    expect(screen.getByText('Privacy & Data')).toBeInTheDocument();
  });

  // 17
  it('clicking name enables inline editing', async () => {
    const user = userEvent.setup();
    await renderAndWait();

    const nameHeading = screen.getByText('Test User');
    await user.click(nameHeading);

    const input = screen.getByDisplayValue('Test User');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  // 18
  it('clicking bio enables inline editing', async () => {
    const user = userEvent.setup();
    await renderAndWait();

    const bioText = screen.getByText('Health enthusiast');
    await user.click(bioText);

    const textarea = screen.getByDisplayValue('Health enthusiast');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  // 19
  it("clicking 'Adjust Goal' enables goal editing", async () => {
    const user = userEvent.setup();
    await renderAndWait();

    const adjustBtn = screen.getByRole('button', { name: /adjust goal/i });
    await user.click(adjustBtn);

    const goalInput = screen.getByDisplayValue('2000');
    expect(goalInput).toBeInTheDocument();
    expect(goalInput.tagName).toBe('INPUT');
  });

  // 20
  it('toggling dark mode calls togglePreference API', async () => {
    const user = userEvent.setup();
    await renderAndWait();

    const darkButton = screen.getByText('Dark').closest('button');
    await user.click(darkButton);

    await waitFor(() => {
      expect(mockTogglePreference).toHaveBeenCalledWith('darkMode', true);
    });
  });

  // 21
  it('toggling email notifications calls togglePreference API', async () => {
    const user = userEvent.setup();
    await renderAndWait();

    const emailPrefRow = screen.getByText('Email Notifications').closest('[class*="cursor-pointer"]');
    await user.click(emailPrefRow);

    await waitFor(() => {
      expect(mockTogglePreference).toHaveBeenCalledWith('emailNotifications', false);
    });
  });

  // 22
  it("displays 'Account Dashboard' label", async () => {
    await renderAndWait();
    expect(screen.getByText('Account Dashboard')).toBeInTheDocument();
  });

  // 23
  it("displays 'Account Preferences' section header", async () => {
    await renderAndWait();
    expect(screen.getByText('Account Preferences')).toBeInTheDocument();
  });

  // 24
  it('displays sign out button', async () => {
    await renderAndWait();
    expect(screen.getByRole('button', { name: /sign out of nutritrack/i })).toBeInTheDocument();
  });

  // 25
  it('displays version text', async () => {
    await renderAndWait();
    expect(screen.getByText(/version 2\.4\.1/i)).toBeInTheDocument();
  });
});
