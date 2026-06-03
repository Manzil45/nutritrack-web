// import api from '../config/api';

// export const profileApi = {
//   async getProfile() {
//     const response = await api.get('/profile');
//     const user = response.data;
//     // Map backend data to the shape frontend expects
//     return {
//       ...user,
//       avatar: user.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
//       description: user.bio || 'Nutritional explorer and fitness enthusiast.',
//       dailyGoal: user.goals ? user.goals.calories : 2000,
//       goalProgress: 65, // This would ideally be calculated from today's meals
//       preferences: user.preferences || {
//         darkMode: false,
//         emailNotifications: true,
//         appleHealthSync: false,
//         language: 'English (US)'
//       }
//     };
//   },

//   async updateProfile(updates) {
//     const response = await api.put('/profile', updates);
//     return response.data;
//   },

//   async togglePreference(key, value) {
//     const response = await api.put('/profile', {
//       preferences: { [key]: value }
//     });
//     return response.data;
//   }
// };


import api from '../config/api';

export const profileApi = {
  async getProfile() {
    const response = await api.get('/api/profile');

    const user = response.data;

    return {
      ...user,
      avatar:
        user.avatar ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',

      description:
        user.bio ||
        'Nutritional explorer and fitness enthusiast.',

      dailyGoal: user.goals
        ? user.goals.calories
        : 2000,

      goalProgress: 65,

      preferences:
        user.preferences || {
          darkMode: false,
          emailNotifications: true,
          appleHealthSync: false,
          language: 'English (US)'
        }
    };
  },

  async updateProfile(updates) {
    const response = await api.put(
      '/api/profile',
      updates
    );

    return response.data;
  },

  async togglePreference(key, value) {
    const response = await api.put(
      '/api/profile',
      {
        preferences: {
          [key]: value
        }
      }
    );

    return response.data;
  }
};

