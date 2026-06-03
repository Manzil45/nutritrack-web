// import api from '../config/api';

// export const authApi = {
//   async login(credentials) {
//     const response = await api.post('/auth/login', credentials);
//     if (response.data.token) {
//       localStorage.setItem('token', response.data.token);
//     }
//     return {
//       user: response.data,
//       token: response.data.token
//     };
//   },

//   async signup(userData) {
//     const payload = {
//       name: userData.name,
//       email: userData.email,
//       password: userData.password
//     };
    
//     const response = await api.post('/auth/register', payload);
//     if (response.data.token) {
//       localStorage.setItem('token', response.data.token);
//     }
//     return {
//       user: response.data,
//       token: response.data.token
//     };
//   },

//   logout() {
//     localStorage.removeItem('token');
//   }
// };



import api from '../config/api';

export const authApi = {
  async login(credentials) {
    const response = await api.post(
      '/api/auth/login',
      credentials
    );

    if (response.data.token) {
      localStorage.setItem(
        'token',
        response.data.token
      );
    }

    return {
      user: response.data,
      token: response.data.token
    };
  },

  async signup(userData) {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password
    };

    const response = await api.post(
      '/api/auth/register',
      payload
    );

    if (response.data.token) {
      localStorage.setItem(
        'token',
        response.data.token
      );
    }

    return {
      user: response.data,
      token: response.data.token
    };
  },

  logout() {
    localStorage.removeItem('token');
  }
};


