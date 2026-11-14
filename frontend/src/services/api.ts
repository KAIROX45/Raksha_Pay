import axios from 'axios';

const metaEnv = (import.meta as any).env || {};
const api = axios.create({
  baseURL: metaEnv.VITE_API_URL || metaEnv.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rakshapay_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login check failure
      const isAuthUrl = error.config.url?.includes('/auth/');
      if (!isAuthUrl) {
        localStorage.removeItem('rakshapay_token');
        localStorage.removeItem('rakshapay_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
