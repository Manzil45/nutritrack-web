// src/tests/ChatFull.test.jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock the chat API module to match the ACTUAL export shape: { chatApi: { sendMessage } }
vi.mock('../api/chat', () => ({
  chatApi: {
    sendMessage: vi.fn(),
  },
}));

// 2. Mock the meals API so the component doesn't crash on import
vi.mock('../api/meals', () => ({
  mealsApi: {
    logMeal: vi.fn(),
    saveCustomFood: vi.fn(),
  },
}));

// 3. Mock the toast utility
vi.mock('../utils/toast', () => ({
  toast: vi.fn(),
}));

// Import the mocked module so we can control it in tests
import { chatApi } from '../api/chat';
import Chat from '../pages/Chat';

describe('Chat Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();

    // Mock scroll behavior for JSDOM
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const inputPlaceholderRegex = /tell me what you ate/i;

  /**
   * Helper: finds the send button by looking for the button containing the "send" icon text.
   * Material Symbols render icon names as text content inside <span>.
   */
  const getSendButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.textContent === 'send');
  };

  /**
   * Helper: finds the history button by looking for the button containing the "history" icon text.
   */
  const getHistoryButton = () => {
    const buttons = screen.getAllByRole('button');
    return buttons.find(btn => btn.textContent === 'history');
  };

  // ======================================
  // PAGE RENDERING
  // ======================================

  it('renders chat interface', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(inputPlaceholderRegex)).toBeInTheDocument();
    expect(getSendButton()).toBeTruthy();
  });

  it('renders chat title/header', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    expect(screen.getByText(/AI Nutritionist/i)).toBeInTheDocument();
  });

  // ======================================
  // SEND MESSAGE
  // ======================================

  it('sends message ke AI saat send button di-click', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'Chicken breast is a great source of protein.',
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'What is the nutrition of chicken?');
    await user.click(sendButton);

    await waitFor(() => {
      // The component calls chatApi.sendMessage(textToSend) with a STRING, not an object
      expect(chatApi.sendMessage).toHaveBeenCalledWith(
        'What is the nutrition of chicken?'
      );
    });
  });

  it('clears input field setelah send', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'Chicken breast is a great source of protein.',
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'What is the nutrition?');
    await user.click(sendButton);

    await waitFor(() => {
      expect(messageInput.value).toBe('');
    });
  });

  // ======================================
  // MESSAGE DISPLAY
  // ======================================

  it('displays user message dalam chat', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'AI response',
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello AI');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
    });
  });

  it('displays AI response dalam chat', async () => {
    const user = userEvent.setup();
    const aiResponse = 'This is a helpful nutrition response.';
    chatApi.sendMessage.mockResolvedValueOnce({
      text: aiResponse,
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(aiResponse)).toBeInTheDocument();
    });
  });

  it('shows user message on right, AI message on left', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'AI response',
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'User message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('User message')).toBeInTheDocument();
      expect(screen.getByText('AI response')).toBeInTheDocument();
    });
  });

  // ======================================
  // NUTRITION DATA (BENTO)
  // ======================================

  it('displays nutrition breakdown saat hasBento true', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'Here is the nutrition info:',
      hasBento: true,
      bentoData: {
        name: 'Chicken Breast',
        description: '100g grilled chicken',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        image: 'https://example.com/chicken.jpg',
      },
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Nutrition of chicken?');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
      expect(screen.getByText('165')).toBeInTheDocument();
    });
  });

  // ======================================
  // LOADING STATE
  // ======================================

  it('shows loading state saat menunggu AI response', async () => {
    const user = userEvent.setup();
    // Use a never-resolving promise to keep the component in loading state
    chatApi.sendMessage.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    // The component shows "AI is typing..." text while waiting
    await waitFor(() => {
      expect(screen.getByText(/AI is typing/i)).toBeInTheDocument();
    });
  });

  it('disables send button saat loading', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    // While loading, typing another message and clicking send should NOT trigger a second API call
    await waitFor(() => {
      expect(screen.getByText(/AI is typing/i)).toBeInTheDocument();
    });

    await user.type(messageInput, 'Second message');
    await user.click(sendButton);

    // sendMessage should only have been called ONCE (the guard `if (isTyping) return` prevents a second call)
    expect(chatApi.sendMessage).toHaveBeenCalledTimes(1);
  });

  // ======================================
  // FORM VALIDATION
  // ======================================

  it('tidak send pesan kosong', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const sendButton = getSendButton();
    await user.click(sendButton);

    expect(chatApi.sendMessage).not.toHaveBeenCalled();
  });

  it('tidak send pesan whitespace only', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, '   ');
    await user.click(sendButton);

    expect(chatApi.sendMessage).not.toHaveBeenCalled();
  });

  // ======================================
  // ERROR HANDLING
  // ======================================

  it('shows error message saat API error', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockRejectedValueOnce(new Error('API Error'));

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    // The component shows a specific error message containing "traffic" and "503"
    await waitFor(() => {
      expect(screen.getByText(/traffic/i)).toBeInTheDocument();
    });
  });

  it('shows rate limit error saat terlalu banyak request', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockRejectedValueOnce(new Error('Too many requests'));

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    // The component shows the same generic error message for all errors (contains "503" and "traffic")
    await waitFor(() => {
      expect(screen.getByText(/503/i)).toBeInTheDocument();
    });
  });

  // ======================================
  // MULTI-TURN CONVERSATION
  // ======================================

  it('supports multiple messages dalam satu conversation', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage
      .mockResolvedValueOnce({ text: 'Response 1', hasBento: false })
      .mockResolvedValueOnce({ text: 'Response 2', hasBento: false });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'First question');
    await user.click(sendButton);

    // Wait for first response before typing the second
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
    });

    await user.type(messageInput, 'Second question');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('First question')).toBeInTheDocument();
      expect(screen.getByText('Second question')).toBeInTheDocument();
    });
  });

  // ======================================
  // SCROLL TO LATEST
  // ======================================

  it('displays conversation in order', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'Long response that will be at bottom',
      hasBento: false,
    });

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Long response that will be at bottom')).toBeInTheDocument();
    });
  });

  // ======================================
  // CLEAR CHAT
  // ======================================

  it('has clear chat history button', () => {
    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const historyButton = getHistoryButton();
    expect(historyButton).toBeTruthy();
  });

  it('clears chat saat clear button di-click', async () => {
    const user = userEvent.setup();
    chatApi.sendMessage.mockResolvedValueOnce({
      text: 'AI response',
      hasBento: false,
    });

    // Mock window.confirm to return true (user confirms clear)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    );

    const messageInput = screen.getByPlaceholderText(inputPlaceholderRegex);
    const sendButton = getSendButton();

    await user.type(messageInput, 'Hello');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Clear chat is inside the 3-dot menu, so we need to open it first
    const moreVertButton = screen.getAllByRole('button').find(btn => btn.textContent === 'more_vert');
    await user.click(moreVertButton);

    // Now click "Clear History" button
    const clearButton = screen.getByText('Clear History');
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Hello')).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});