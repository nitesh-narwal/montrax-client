import axios from 'axios';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generate once per "logical action" (e.g. opening a payment form) and reuse
// across retries of that same submission — see section 3.8 of the API docs.
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

let lastRateLimitToastAt = 0;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('money-manager-storage');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      // Debounce so a burst of parallel requests doesn't spam multiple toasts
      const now = Date.now();
      if (now - lastRateLimitToastAt > 3000) {
        lastRateLimitToastAt = now;
        const retryAfter = Number(error.response.headers?.['retry-after']);
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
        const label = wait >= 60 ? `${Math.ceil(wait / 60)} minute(s)` : `${wait} seconds`;
        toast.error(`You're doing that too much. Try again in about ${label}.`);
      }
    } else {
      console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
