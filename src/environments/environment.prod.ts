export const environment = {
  production: true,
  apiBaseUrl: 'https://api.yourdomain.com/api',
  apiEndpoints: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    USERS: {
      ALL: '/users',
      BY_ID: (id: string | number) => `/users/${id}`,
      UPDATE_ME: '/users/me',
      TOGGLE_STATUS_BY_ID: (id: string | number) => `/users/${id}/status`,
    }
  }
};
