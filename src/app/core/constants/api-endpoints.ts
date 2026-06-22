export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    profile: "/api/auth/profile"
  },
  ai: {
    chat: "/api/gemini/chat",
    audit: "/api/gemini/audit"
  },
  dossiers: {
    list: "/api/dossiers",
    submit: "/api/dossiers/submit",
    updateStatus: "/api/dossiers/status"
  }
};
