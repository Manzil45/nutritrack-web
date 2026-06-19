// src/tests/MealReminderFull.test.jsx

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MealReminderPage from '../pages/MealReminderPage';

// Mock API Meal Reminder
const mockGetScheduledMealReminders = vi.fn();
const mockCreateScheduledMealReminder = vi.fn();
const mockUpdateScheduledMealReminder = vi.fn();
const mockDeleteScheduledMealReminder = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../api/scheduledMealReminderApi', () => ({
    scheduledMealReminderApi: {
        getScheduledMealReminders: (...args) =>
            mockGetScheduledMealReminders(...args),
        createScheduledMealReminder: (...args) =>
            mockCreateScheduledMealReminder(...args),
        updateScheduledMealReminder: (...args) =>
            mockUpdateScheduledMealReminder(...args),
        deleteScheduledMealReminder: (...args) =>
            mockDeleteScheduledMealReminder(...args),
    },
}));

vi.mock('../utils/toast', () => ({
    toast: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockReminderList = [
    {
        _id: 'reminder_1',
        title: 'Breakfast',
        time: '08:00',
        days: ['Mon', 'Wed', 'Fri'],
        message: 'Start your day strong',
        isActive: true,
        createdAt: '2026-06-15T01:00:00.000Z',
        updatedAt: '2026-06-15T01:00:00.000Z',
    },
    {
        _id: 'reminder_2',
        title: 'Afternoon Snack',
        time: '15:00',
        days: ['Tue', 'Thu'],
        message: 'A healthy snack for self reward',
        isActive: false,
        createdAt: '2026-06-15T02:00:00.000Z',
        updatedAt: '2026-06-15T02:00:00.000Z',
    },
];

function renderMealReminderPage() {
    return render(
        <MemoryRouter>
            <MealReminderPage />
        </MemoryRouter>
    );
}

describe('Meal Reminder Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        mockGetScheduledMealReminders.mockResolvedValue(mockReminderList);

        mockCreateScheduledMealReminder.mockResolvedValue({
            _id: 'reminder_3',
            title: 'Dinner',
            time: '19:00',
            days: ['Mon'],
            message: 'Dinner time',
            isActive: true,
            createdAt: '2026-06-15T03:00:00.000Z',
            updatedAt: '2026-06-15T03:00:00.000Z',
        });

        mockUpdateScheduledMealReminder.mockResolvedValue({
            _id: 'reminder_1',
            title: 'Breakfast',
            time: '08:00',
            days: ['Mon', 'Wed', 'Fri'],
            message: 'Start your day strong',
            isActive: false,
            createdAt: '2026-06-15T01:00:00.000Z',
            updatedAt: '2026-06-15T01:00:00.000Z',
        });

        mockDeleteScheduledMealReminder.mockResolvedValue({
            id: 'reminder_1',
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('1. menampilkan loading saat reminder sedang diambil', () => {
        mockGetScheduledMealReminders.mockImplementation(
            () => new Promise(() => { })
        );

        renderMealReminderPage();

        expect(screen.getByText('Loading reminders...')).toBeInTheDocument();
    });

    it('2. memanggil API getScheduledMealReminders saat halaman dibuka', async () => {
        renderMealReminderPage();

        await waitFor(() => {
            expect(mockGetScheduledMealReminders).toHaveBeenCalledTimes(1);
        });
    });

    it('3. menampilkan daftar reminder dari API', async () => {
        renderMealReminderPage();

        expect(await screen.findByText('Breakfast')).toBeInTheDocument();
        expect(screen.getByText('Afternoon Snack')).toBeInTheDocument();
        expect(screen.getByText('08:00')).toBeInTheDocument();
        expect(screen.getByText('15:00')).toBeInTheDocument();
    });

    it('4. menampilkan empty state jika belum ada reminder', async () => {
        mockGetScheduledMealReminders.mockResolvedValue([]);

        renderMealReminderPage();

        expect(await screen.findByText('No reminders yet')).toBeInTheDocument();
    });

    it('5. menampilkan validasi jika form reminder belum lengkap', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        await user.click(screen.getByRole('button', { name: /add reminder/i }));

        expect(
            screen.getByText('Please fill meal type, reminder time, and repeat day.')
        ).toBeInTheDocument();

        expect(mockCreateScheduledMealReminder).not.toHaveBeenCalled();
    });

    it('6. berhasil membuat reminder baru dengan input valid', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        await user.type(screen.getByLabelText(/meal type/i), 'Dinner');

        fireEvent.change(screen.getByLabelText(/^time$/i), {
            target: { value: '19:00' },
        });

        await user.click(screen.getByRole('button', { name: 'Mon' }));

        await user.type(
            screen.getByLabelText(/message optional/i),
            'Dinner time'
        );

        await user.click(screen.getByRole('button', { name: /add reminder/i }));

        await waitFor(() => {
            expect(mockCreateScheduledMealReminder).toHaveBeenCalledWith({
                title: 'Dinner',
                time: '19:00',
                days: ['Mon'],
                message: 'Dinner time',
            });
        });
    });

    it('7. berhasil toggle aktif/nonaktif reminder', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        const toggleButtons = screen.getAllByLabelText('Toggle reminder');

        await user.click(toggleButtons[0]);

        await waitFor(() => {
            expect(mockUpdateScheduledMealReminder).toHaveBeenCalledWith(
                'reminder_1',
                {
                    isActive: false,
                }
            );
        });
    });

    it('8. klik edit reminder mengisi data ke form', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        const editButtons = screen.getAllByLabelText('Edit reminder');

        await user.click(editButtons[0]);

        expect(screen.getByDisplayValue('Breakfast')).toBeInTheDocument();
        expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Start your day strong')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /save changes/i })
        ).toBeInTheDocument();
    });

    it('9. berhasil menyimpan hasil edit reminder', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        const editButtons = screen.getAllByLabelText('Edit reminder');

        await user.click(editButtons[0]);

        const mealTypeInput = screen.getByDisplayValue('Breakfast');

        await user.clear(mealTypeInput);
        await user.type(mealTypeInput, 'Updated Breakfast');

        await user.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateScheduledMealReminder).toHaveBeenCalledWith(
                'reminder_1',
                expect.objectContaining({
                    title: 'Updated Breakfast',
                    time: '08:00',
                    days: ['Mon', 'Wed', 'Fri'],
                    message: 'Start your day strong',
                })
            );
        });
    });

    it('10. berhasil menghapus reminder', async () => {
        const user = userEvent.setup();

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        const deleteButtons = screen.getAllByLabelText('Delete reminder');

        await user.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockDeleteScheduledMealReminder).toHaveBeenCalledWith('reminder_1');
        });
    });

    it('11. popup muncul jika jam device sama dengan jam reminder dan hari ini masuk repeat', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-06-15T08:00:00'));

        mockGetScheduledMealReminders.mockResolvedValue([
            {
                _id: 'reminder_popup_1',
                title: 'Breakfast',
                time: '08:00',
                days: ['Mon'],
                message: 'Start your day strong',
                isActive: true,
                createdAt: '2026-06-14T01:00:00.000Z',
                updatedAt: '2026-06-14T01:00:00.000Z',
            },
        ]);

        renderMealReminderPage();

        expect(await screen.findByText('Breakfast Time!')).toBeInTheDocument();
        expect(screen.getAllByText('Start your day strong')).toHaveLength(2);
    });

    it('12. popup tetap muncul untuk alarm hari ini walaupun hari ini tidak dipilih di repeat', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-06-16T08:00:00'));

        mockGetScheduledMealReminders.mockResolvedValue([
            {
                _id: 'reminder_popup_2',
                title: 'Breakfast',
                time: '08:00',
                days: ['Mon', 'Wed', 'Thu', 'Fri'],
                message: 'Today alarm still works',
                isActive: true,
                createdAt: '2026-06-16T01:00:00.000Z',
                updatedAt: '2026-06-16T01:00:00.000Z',
            },
        ]);

        renderMealReminderPage();

        expect(await screen.findByText('Breakfast Time!')).toBeInTheDocument();
        expect(screen.getAllByText('Today alarm still works')).toHaveLength(2);
    });

    it('13. popup tidak muncul jika reminder tidak aktif', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-06-15T08:00:00'));

        mockGetScheduledMealReminders.mockResolvedValue([
            {
                _id: 'reminder_inactive',
                title: 'Breakfast',
                time: '08:00',
                days: ['Mon'],
                message: 'Inactive reminder',
                isActive: false,
                createdAt: '2026-06-15T01:00:00.000Z',
                updatedAt: '2026-06-15T01:00:00.000Z',
            },
        ]);

        renderMealReminderPage();

        await screen.findByText('Breakfast');

        expect(screen.queryByText('Breakfast Time!')).not.toBeInTheDocument();
    });

    it('14. tombol Later menutup popup reminder', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-06-15T08:00:00'));

        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });

        mockGetScheduledMealReminders.mockResolvedValue([
            {
                _id: 'reminder_popup_3',
                title: 'Breakfast',
                time: '08:00',
                days: ['Mon'],
                message: 'Start your day strong',
                isActive: true,
                createdAt: '2026-06-15T01:00:00.000Z',
                updatedAt: '2026-06-15T01:00:00.000Z',
            },
        ]);

        renderMealReminderPage();

        expect(await screen.findByText('Breakfast Time!')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /later/i }));

        expect(screen.queryByText('Breakfast Time!')).not.toBeInTheDocument();
    });

    it('15. tombol Log Meal pada popup mengarah ke halaman chat', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(new Date('2026-06-15T08:00:00'));

        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });

        mockGetScheduledMealReminders.mockResolvedValue([
            {
                _id: 'reminder_popup_4',
                title: 'Breakfast',
                time: '08:00',
                days: ['Mon'],
                message: 'Start your day strong',
                isActive: true,
                createdAt: '2026-06-15T01:00:00.000Z',
                updatedAt: '2026-06-15T01:00:00.000Z',
            },
        ]);

        renderMealReminderPage();

        expect(await screen.findByText('Breakfast Time!')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /log meal/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
});