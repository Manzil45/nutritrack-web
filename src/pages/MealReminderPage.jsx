import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduledMealReminderApi } from '../api/scheduledMealReminderApi';
import { toast } from '../utils/toast';

// === FITUR MEAL REMINDER - START ===
// Page ini berfungsi untuk membuat, mengedit, menghapus, mengaktifkan,
// dan menampilkan popup reminder saat jam device sama dengan jadwal reminder.

const MEAL_REMINDER_LAST_POPUP_KEY =
    'nutritrack_scheduled_meal_reminder_last_popup';

const MEAL_REMINDER_DAY_OPTIONS = [
    { key: 'Mon', label: 'Mon' },
    { key: 'Tue', label: 'Tue' },
    { key: 'Wed', label: 'Wed' },
    { key: 'Thu', label: 'Thu' },
    { key: 'Fri', label: 'Fri' },
    { key: 'Sat', label: 'Sat' },
    { key: 'Sun', label: 'Sun' },
];

const JS_DAY_TO_REMINDER_KEY = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
];

const getDeviceDayKey = () => {
    return JS_DAY_TO_REMINDER_KEY[new Date().getDay()];
};

const getDeviceTimeValue = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return `${hour}:${minute}`;
};

const getDeviceDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${date}`;
};

const DEFAULT_REMINDER_FORM = {
    title: '',
    time: '',
    days: [],
    message: '',
};

export default function MealReminderPage() {
    const navigate = useNavigate();

    const [scheduledReminders, setScheduledReminders] = useState([]);
    const [reminderForm, setReminderForm] = useState(DEFAULT_REMINDER_FORM);
    const [editingReminderId, setEditingReminderId] = useState(null);
    const [activePopupReminder, setActivePopupReminder] = useState(null);
    const [isLoadingReminder, setIsLoadingReminder] = useState(true);
    const [isSavingReminder, setIsSavingReminder] = useState(false);
    const [reminderErrorMessage, setReminderErrorMessage] = useState('');

    const isEditingReminder = editingReminderId !== null;

    const activeReminderCount = useMemo(() => {
        return scheduledReminders.filter((reminder) => reminder.isActive).length;
    }, [scheduledReminders]);

    const fetchScheduledReminders = async () => {
        try {
            setIsLoadingReminder(true);
            setReminderErrorMessage('');

            const data =
                await scheduledMealReminderApi.getScheduledMealReminders();

            setScheduledReminders(Array.isArray(data) ? data : []);
        } catch (error) {
            const message =
                error.response?.data?.message ||
                'Failed to load meal reminders. Please login again.';

            setReminderErrorMessage(message);
        } finally {
            setIsLoadingReminder(false);
        }
    };

    useEffect(() => {
        fetchScheduledReminders();
    }, []);

    useEffect(() => {
        if (scheduledReminders.length === 0) {
            return undefined;
        }

        const checkScheduledReminderTime = () => {
            const todayKey = getDeviceDayKey();
            const currentTime = getDeviceTimeValue();
            const currentDate = getDeviceDateKey();

            const dueReminder = scheduledReminders.find((reminder) => {
                if (!reminder.isActive) {
                    return false;
                }

                if (!Array.isArray(reminder.days)) {
                    return false;
                }
                // === FITUR MEAL REMINDER - UPDATE LOGIC START ===
                // Logic alarm:
                // 1. Jika hari ini termasuk repeat day, alarm boleh bunyi.
                // 2. Jika hari ini TIDAK termasuk repeat day, alarm tetap boleh bunyi
                //    khusus untuk alarm yang dibuat/diedit hari ini.
                // 3. Jadi repeat day dipakai untuk pengulangan hari berikutnya,
                //    bukan untuk mematikan alarm hari ini.
                const reminderCreatedOrUpdatedDate = new Date(
                    reminder.updatedAt || reminder.createdAt
                );

                const reminderCreatedOrUpdatedDateKey = `${reminderCreatedOrUpdatedDate.getFullYear()}-${String(
                    reminderCreatedOrUpdatedDate.getMonth() + 1
                ).padStart(2, '0')}-${String(reminderCreatedOrUpdatedDate.getDate()).padStart(
                    2,
                    '0'
                )}`;

                const isRepeatedToday =
                    Array.isArray(reminder.days) && reminder.days.includes(todayKey);

                const isTodayAlarm =
                    reminderCreatedOrUpdatedDateKey === currentDate;

                if (!isRepeatedToday && !isTodayAlarm) {
                    return false;
                }

                if (reminder.time !== currentTime) {
                    return false;
                }
                // === FITUR MEAL REMINDER - UPDATE LOGIC END ===
                const popupKey = `${reminder._id}-${currentDate}-${currentTime}`;
                const lastPopupKey = localStorage.getItem(
                    MEAL_REMINDER_LAST_POPUP_KEY
                );

                return popupKey !== lastPopupKey;
            });

            if (dueReminder) {
                const popupKey = `${dueReminder._id}-${currentDate}-${currentTime}`;

                localStorage.setItem(
                    MEAL_REMINDER_LAST_POPUP_KEY,
                    popupKey
                );

                setActivePopupReminder(dueReminder);
            }
        };

        checkScheduledReminderTime();

        const reminderIntervalId = setInterval(
            checkScheduledReminderTime,
            5000
        );

        return () => clearInterval(reminderIntervalId);
    }, [scheduledReminders]);

    const resetReminderForm = () => {
        setReminderForm(DEFAULT_REMINDER_FORM);
        setEditingReminderId(null);
    };

    const handleToggleReminderDay = (dayKey) => {
        setReminderForm((currentForm) => {
            const isAlreadySelected = currentForm.days.includes(dayKey);

            return {
                ...currentForm,
                days: isAlreadySelected
                    ? currentForm.days.filter((day) => day !== dayKey)
                    : [...currentForm.days, dayKey],
            };
        });
    };

    const handleSubmitReminder = async (event) => {
        event.preventDefault();

        if (
            !reminderForm.title.trim() ||
            !reminderForm.time ||
            reminderForm.days.length === 0
        ) {
            setReminderErrorMessage(
                'Please fill meal type, reminder time, and repeat day.'
            );

            return;
        }

        try {
            setIsSavingReminder(true);
            setReminderErrorMessage('');

            const payload = {
                title: reminderForm.title.trim(),
                time: reminderForm.time,
                days: reminderForm.days,
                message:
                    reminderForm.message.trim() ||
                    'Time to stay consistent with your nutrition.',
            };

            if (isEditingReminder) {
                const updatedReminder =
                    await scheduledMealReminderApi.updateScheduledMealReminder(
                        editingReminderId,
                        payload
                    );

                setScheduledReminders((currentReminders) =>
                    currentReminders.map((reminder) =>
                        reminder._id === editingReminderId
                            ? updatedReminder
                            : reminder
                    )
                );

                resetReminderForm();
                toast('Meal reminder updated!');
                return;
            }

            const newReminder =
                await scheduledMealReminderApi.createScheduledMealReminder(
                    payload
                );

            setScheduledReminders((currentReminders) => [
                newReminder,
                ...currentReminders,
            ]);

            resetReminderForm();
            toast('Meal reminder added!');
        } catch (error) {
            const message =
                error.response?.data?.message ||
                'Failed to save meal reminder. Please try again.';

            setReminderErrorMessage(message);
            toast(message, 'error');
        } finally {
            setIsSavingReminder(false);
        }
    };

    const handleEditReminder = (reminder) => {
        setEditingReminderId(reminder._id);

        setReminderForm({
            title: reminder.title,
            time: reminder.time,
            days: reminder.days || [],
            message: reminder.message || '',
        });

        setReminderErrorMessage('');
    };

    const handleToggleReminderStatus = async (reminder) => {
        try {
            setReminderErrorMessage('');

            const updatedReminder =
                await scheduledMealReminderApi.updateScheduledMealReminder(
                    reminder._id,
                    {
                        isActive: !reminder.isActive,
                    }
                );

            setScheduledReminders((currentReminders) =>
                currentReminders.map((item) =>
                    item._id === reminder._id ? updatedReminder : item
                )
            );
        } catch (error) {
            const message =
                error.response?.data?.message ||
                'Failed to update reminder status.';

            setReminderErrorMessage(message);
            toast(message, 'error');
        }
    };

    const handleDeleteReminder = async (id) => {
        try {
            setReminderErrorMessage('');

            await scheduledMealReminderApi.deleteScheduledMealReminder(id);

            setScheduledReminders((currentReminders) =>
                currentReminders.filter((reminder) => reminder._id !== id)
            );

            if (editingReminderId === id) {
                resetReminderForm();
            }

            toast('Meal reminder deleted!');
        } catch (error) {
            const message =
                error.response?.data?.message ||
                'Failed to delete meal reminder.';

            setReminderErrorMessage(message);
            toast(message, 'error');
        }
    };

    const handleLaterPopup = () => {
        setActivePopupReminder(null);
    };

    const handleLogMealFromPopup = () => {
        setActivePopupReminder(null);
        navigate('/chat');
    };

    return (
        <section className="relative pb-24">
            <div
                className={
                    activePopupReminder
                        ? 'pointer-events-none select-none blur-sm'
                        : ''
                }
            >
                <div className="mb-8">
                    <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                        Meals Reminder
                    </span>

                    <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
                        Stay on Schedule
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500 md:text-base">
                        Never miss a meal. Get timely reminders and log your nutrition on time.
                    </p>
                </div>

                {reminderErrorMessage && (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
                        {reminderErrorMessage}
                    </div>
                )}

                <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
                    <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/60 md:p-7">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="font-headline text-2xl font-bold text-on-surface">
                                    All Alarm
                                </h3>

                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    {activeReminderCount} active reminder
                                    {activeReminderCount !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <span className="material-symbols-outlined">
                                    notifications_active
                                </span>
                            </div>
                        </div>

                        {isLoadingReminder ? (
                            <div className="flex min-h-[300px] items-center justify-center text-sm font-semibold text-slate-500">
                                Loading reminders...
                            </div>
                        ) : scheduledReminders.length === 0 ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-outline-variant/30 bg-slate-50 p-8 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                                    <span className="material-symbols-outlined text-4xl">
                                        notifications_off
                                    </span>
                                </div>

                                <h4 className="font-headline text-xl font-bold text-on-surface">
                                    No reminders yet
                                </h4>

                                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                                    Create your first meal reminder from the form on the right side.
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
                                {scheduledReminders.map((reminder) => (
                                    <article
                                        key={reminder._id}
                                        className="rounded-[1.5rem] border border-outline-variant/30 bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                                    >
                                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <span className="material-symbols-outlined">
                                                        alarm
                                                    </span>
                                                </div>

                                                <div>
                                                    <h4 className="font-headline text-xl font-bold text-on-surface">
                                                        {reminder.title}
                                                    </h4>

                                                    <div className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-600">
                                                        <span className="material-symbols-outlined text-xl">
                                                            schedule
                                                        </span>
                                                        <span>{reminder.time}</span>
                                                    </div>

                                                    <p className="mt-2 max-w-xl text-sm font-medium text-slate-500">
                                                        {reminder.message}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-3 lg:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleReminderStatus(reminder)
                                                    }
                                                    className={`relative h-8 w-14 rounded-full transition ${reminder.isActive
                                                        ? 'bg-primary'
                                                        : 'bg-slate-300'
                                                        }`}
                                                    aria-label="Toggle reminder"
                                                >
                                                    <span
                                                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${reminder.isActive ? 'left-7' : 'left-1'
                                                            }`}
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleEditReminder(reminder)}
                                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-primary/10 hover:text-primary"
                                                    aria-label="Edit reminder"
                                                >
                                                    <span className="material-symbols-outlined text-xl">
                                                        edit
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteReminder(reminder._id)
                                                    }
                                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                                                    aria-label="Delete reminder"
                                                >
                                                    <span className="material-symbols-outlined text-xl">
                                                        delete
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {MEAL_REMINDER_DAY_OPTIONS.map((day) => {
                                                const isSelected = reminder.days?.includes(
                                                    day.key
                                                );

                                                return (
                                                    <span
                                                        key={day.key}
                                                        className={`rounded-xl border px-3 py-1 text-xs font-bold ${isSelected
                                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                                            : 'border-outline-variant/30 bg-slate-50 text-slate-400'
                                                            }`}
                                                    >
                                                        {day.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6">
                        <form
                            onSubmit={handleSubmitReminder}
                            className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/60"
                        >
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface">
                                        {isEditingReminder
                                            ? 'Edit Reminder'
                                            : 'Create Reminder'}
                                    </h3>

                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        {isEditingReminder
                                            ? 'Update your selected meal reminder.'
                                            : 'Add a new schedule for your meal reminder.'}
                                    </p>
                                </div>

                                {isEditingReminder && (
                                    <button
                                        type="button"
                                        onClick={resetReminderForm}
                                        className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <label className="mb-5 block">
                                <span className="mb-2 block text-sm font-bold text-slate-600">
                                    Meal Type
                                </span>

                                <input
                                    value={reminderForm.title}
                                    onChange={(event) =>
                                        setReminderForm((currentForm) => ({
                                            ...currentForm,
                                            title: event.target.value.slice(0, 50),
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-outline-variant/30 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    placeholder="Example: Breakfast"
                                    type="text"
                                />
                            </label>

                            <label className="mb-5 block">
                                <span className="mb-2 block text-sm font-bold text-slate-600">
                                    Time
                                </span>

                                <input
                                    value={reminderForm.time}
                                    onChange={(event) =>
                                        setReminderForm((currentForm) => ({
                                            ...currentForm,
                                            time: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-outline-variant/30 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    type="time"
                                />
                            </label>

                            <div className="mb-5">
                                <p className="mb-2 text-sm font-bold text-slate-600">
                                    Repeat
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {MEAL_REMINDER_DAY_OPTIONS.map((day) => {
                                        const isSelected = reminderForm.days.includes(
                                            day.key
                                        );

                                        return (
                                            <button
                                                key={day.key}
                                                type="button"
                                                onClick={() => handleToggleReminderDay(day.key)}
                                                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${isSelected
                                                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'border-outline-variant/30 bg-white text-slate-500 hover:border-primary/40 hover:text-primary'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="mb-6 block">
                                <span className="mb-2 block text-sm font-bold text-slate-600">
                                    Message Optional
                                </span>

                                <textarea
                                    value={reminderForm.message}
                                    onChange={(event) =>
                                        setReminderForm((currentForm) => ({
                                            ...currentForm,
                                            message: event.target.value.slice(0, 150),
                                        }))
                                    }
                                    className="min-h-24 w-full resize-none rounded-2xl border border-outline-variant/30 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    placeholder="Example: Don't forget to log your breakfast."
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSavingReminder}
                                className="w-full rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSavingReminder
                                    ? 'Saving...'
                                    : isEditingReminder
                                        ? 'Save Changes'
                                        : 'Add Reminder'}
                            </button>
                        </form>

                        <div className="rounded-[2rem] border border-primary/10 bg-primary/5 p-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined">
                                        favorite
                                    </span>
                                </div>

                                <div>
                                    <h4 className="font-headline text-lg font-bold text-on-surface">
                                        Consistency is the key!
                                    </h4>

                                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                                        Small daily habits lead to big results. Stay consistent and keep tracking.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {activePopupReminder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
                        <div className="flex items-start gap-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    notifications
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-primary">
                                            Meal Reminder
                                        </p>

                                        <h3 className="mt-2 font-headline text-3xl font-bold text-on-surface">
                                            {activePopupReminder.title} Time!
                                        </h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setActivePopupReminder(null)}
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                        aria-label="Close notification"
                                    >
                                        <span className="material-symbols-outlined">
                                            close
                                        </span>
                                    </button>
                                </div>

                                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-lg font-bold text-slate-600">
                                    <span className="material-symbols-outlined text-primary">
                                        schedule
                                    </span>
                                    <span>{activePopupReminder.time}</span>
                                </div>

                                <p className="mt-5 text-base font-semibold leading-relaxed text-slate-500 md:text-lg">
                                    {activePopupReminder.message}
                                </p>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={handleLaterPopup}
                                        className="rounded-2xl border border-outline-variant/30 bg-white py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                                    >
                                        Later
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleLogMealFromPopup}
                                        className="rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-[0.98]"
                                    >
                                        Log Meal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
// === FITUR MEAL REMINDER - END ===