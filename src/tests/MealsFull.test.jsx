// src/tests/MealsFull.test.jsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Meals from '../pages/Meals';

// Mock modules
vi.mock('../api/meals', () => ({
  mealsApi: {
    getSavedMeals: vi.fn(),
    searchMeals: vi.fn(),
    logMeal: vi.fn(),
    saveCustomFood: vi.fn(),
  },
}));

vi.mock('../utils/toast', () => ({
  toast: vi.fn(),
}));

vi.mock('../components/Shimmer', () => ({
  MealCardShimmer: () => <div data-testid="shimmer">Loading...</div>,
}));

vi.mock('../components/SavedMealCard', () => ({
  default: ({ name, calories }) => (
    <div>
      <span>{name}</span>
      <span>{calories}</span>
    </div>
  ),
}));

import { mealsApi } from '../api/meals';
// import { toast } from '../utils/toast';

describe('Meals Page', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    // Default: searchMeals resolves to empty array
    mealsApi.searchMeals.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Helper: render + advance past the 300ms debounce + wait for fetch */
  const renderAndSettle = async () => {
    render(<Meals />);
    // advance past the 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
  };

  // ======================================
  // PAGE RENDERING
  // ======================================

  it('1. renders meals page header (Saved Meals)', async () => {
    await renderAndSettle();
    expect(screen.getByText('Saved Meals')).toBeInTheDocument();
  });

  it('2. renders the New Meal card', async () => {
    await renderAndSettle();
    expect(screen.getByText('New Meal')).toBeInTheDocument();
  });

  // ======================================
  // LOADING STATE
  // ======================================

  it('3. shows shimmer loading state during fetch', () => {
    // searchMeals never resolves → component stays in loading state
    mealsApi.searchMeals.mockImplementation(() => new Promise(() => {}));

    render(<Meals />);

    // Before debounce fires, loading is true (initial state)
    expect(screen.getAllByTestId('shimmer').length).toBeGreaterThan(0);
  });

  // ======================================
  // GET / DISPLAY MEALS
  // ======================================

  it('4. loads and displays meals from API', async () => {
    const mockMeals = [
      { _id: '1', name: 'Eggs & Toast', calories: 300, protein: 18, carbs: 20, fat: 15 },
      { _id: '2', name: 'Chicken Rice', calories: 500, protein: 40, carbs: 50, fat: 15 },
    ];
    mealsApi.searchMeals.mockResolvedValue(mockMeals);

    await renderAndSettle();

    await waitFor(() => {
      expect(screen.getByText('Eggs & Toast')).toBeInTheDocument();
      expect(screen.getByText('Chicken Rice')).toBeInTheDocument();
    });
  });

  it('5. displays meal cards with nutrition info (calories)', async () => {
    const mockMeals = [
      { _id: '1', name: 'Oatmeal', calories: 250, protein: 10, carbs: 40, fat: 5 },
    ];
    mealsApi.searchMeals.mockResolvedValue(mockMeals);

    await renderAndSettle();

    await waitFor(() => {
      expect(screen.getByText('Oatmeal')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  it('6. displays empty state when search returns no meals', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mealsApi.searchMeals.mockResolvedValue([]);

    render(<Meals />);

    // Advance past initial debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // Type a search query so empty state message shows
    await user.type(screen.getByPlaceholderText('Search your library...'), 'pizza');

    // Advance past debounce for the search
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText(/No matches found for "pizza"/)).toBeInTheDocument();
    });
  });

  // ======================================
  // SEARCH
  // ======================================

  it('7. searches meals when typing in search box', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<Meals />);

    // Advance past initial mount debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // Clear prior calls from mount
    mealsApi.searchMeals.mockClear();

    await user.type(screen.getByPlaceholderText('Search your library...'), 'chicken');

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      // searchMeals should have been called; the last call should contain the full typed text
      const calls = mealsApi.searchMeals.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toContain('chicken');
    });
  });

  // ======================================
  // ADD MEAL MODAL
  // ======================================

  it('8. opens add meal modal when New Meal card is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Avocado Toast')).toBeInTheDocument();
    });
  });

  it('9. modal has meal name input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByPlaceholderText('e.g. Avocado Toast')).toBeInTheDocument();
  });

  it('10. modal has calorie input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByText('Calories')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('kcal')).toBeInTheDocument();
  });

  it('11. modal has protein input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByText('Protein (g)')).toBeInTheDocument();
  });

  it('12. modal has carbs input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByText('Carbs (g)')).toBeInTheDocument();
  });

  it('13. modal has fat input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByText('Fat (g)')).toBeInTheDocument();
  });

  it('14. modal has image URL input', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    expect(screen.getByText('Image URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://images.unsplash.com/...')).toBeInTheDocument();
  });

  // ======================================
  // SUBMIT NEW MEAL
  // ======================================

  it('15. submits new meal with saveCustomFood', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mealsApi.saveCustomFood.mockResolvedValue({ _id: 'new1', name: 'Avocado Toast' });

    await renderAndSettle();

    // Open modal
    await user.click(screen.getByText('New Meal'));

    // Fill form
    await user.type(screen.getByPlaceholderText('e.g. Avocado Toast'), 'Avocado Toast');

    const kcalInputs = screen.getAllByPlaceholderText('grams');
    const kcalInput = screen.getByPlaceholderText('kcal');

    await user.type(kcalInput, '350');
    await user.type(kcalInputs[0], '12'); // protein
    await user.type(kcalInputs[1], '40'); // carbs
    await user.type(kcalInputs[2], '18'); // fat

    // Submit
    await user.click(screen.getByText('Save to Library'));

    await waitFor(() => {
      expect(mealsApi.saveCustomFood).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Avocado Toast',
          calories: 350,
          protein: 12,
          carbs: 40,
          fat: 18,
        })
      );
    });
  });

  it('16. closes modal after successful submit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mealsApi.saveCustomFood.mockResolvedValue({ _id: 'new1' });

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    // Fill required fields
    await user.type(screen.getByPlaceholderText('e.g. Avocado Toast'), 'Test');
    await user.type(screen.getByPlaceholderText('kcal'), '100');
    const gramsInputs = screen.getAllByPlaceholderText('grams');
    await user.type(gramsInputs[0], '10');
    await user.type(gramsInputs[1], '10');
    await user.type(gramsInputs[2], '10');

    await user.click(screen.getByText('Save to Library'));

    // Advance timers for the refetch debounce after submission
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.queryByText('New Recipe')).not.toBeInTheDocument();
    });
  });

  it('17. shows loading state on submit button while creating', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    // saveCustomFood never resolves so isSubmitting stays true
    mealsApi.saveCustomFood.mockImplementation(() => new Promise(() => {}));

    await renderAndSettle();

    await user.click(screen.getByText('New Meal'));

    // Fill required fields
    await user.type(screen.getByPlaceholderText('e.g. Avocado Toast'), 'Test');
    await user.type(screen.getByPlaceholderText('kcal'), '100');
    const gramsInputs = screen.getAllByPlaceholderText('grams');
    await user.type(gramsInputs[0], '10');
    await user.type(gramsInputs[1], '10');
    await user.type(gramsInputs[2], '10');

    await user.click(screen.getByText('Save to Library'));

    await waitFor(() => {
      expect(screen.getByText('Creating Recipe...')).toBeInTheDocument();
    });
  });

  it('18. modal can be closed with close button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await renderAndSettle();

    // Open modal
    await user.click(screen.getByText('New Meal'));

    // Verify modal is open
    expect(screen.getByText('New Recipe')).toBeInTheDocument();

    // Click the close button (the button containing the 'close' icon text)
    const closeButton = screen.getByText('close'); // material icon text
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('New Recipe')).not.toBeInTheDocument();
    });
  });
});
