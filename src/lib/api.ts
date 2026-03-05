import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('API Request:', config.method?.toUpperCase(), API_BASE_URL + config.url);
  console.log('Token present:', !!token, token ? `(${token.substring(0, 30)}...)` : '');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status, 'OK');
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('money-manager-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
