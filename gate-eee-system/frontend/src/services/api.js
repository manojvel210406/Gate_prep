import axios from 'axios';

const api = axios.create({
  baseURL: https://gate-prep-n17q.onrender.com || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('gate_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gate_token');
      localStorage.removeItem('gate_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
