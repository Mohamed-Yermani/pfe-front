// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8089/api',
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
