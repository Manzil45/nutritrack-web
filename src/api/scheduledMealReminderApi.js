import api from '../config/api';

// === FITUR MEAL REMINDER - START ===
// API frontend untuk menghubungkan halaman reminder dengan backend.
// Pakai /api/meal-reminders karena baseURL frontend hanya http://localhost:5000.
export const scheduledMealReminderApi = {
    async getScheduledMealReminders() {
        const response = await api.get('/api/meal-reminders');
        return response.data;
    },

    async createScheduledMealReminder(reminderData) {
        const response = await api.post('/api/meal-reminders', reminderData);
        return response.data;
    },

    async updateScheduledMealReminder(id, reminderData) {
        const response = await api.put(
            `/api/meal-reminders/${id}`,
            reminderData
        );

        return response.data;
    },

    async deleteScheduledMealReminder(id) {
        const response = await api.delete(`/api/meal-reminders/${id}`);
        return response.data;
    },
};
// === FITUR MEAL REMINDER - END ===