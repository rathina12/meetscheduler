import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;
    // 409 conflict is handled by the caller, not here
    if (error.response?.status === 409) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status !== 401 && error.response?.status !== 409) {
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: data => api.post('/api/auth/register', data),
  login:    data => api.post('/api/auth/login', data),
  refresh:  token => api.post('/api/auth/refresh', { refreshToken: token }),
};

export const meetingsAPI = {
  getAll:       ()              => api.get('/api/meetings'),
  getToday:     ()              => api.get('/api/meetings/today'),
  getUpcoming:  ()              => api.get('/api/meetings/upcoming'),
  getByRange:   (start, end)    => api.get('/api/meetings/range', { params: { start, end } }),
  getById:      id              => api.get(`/api/meetings/${id}`),
  getDashboard: ()              => api.get('/api/meetings/dashboard'),
  create:       (data, force)   => api.post(`/api/meetings${force ? '?forceCreate=true' : ''}`, data),
  update:       (id, data)      => api.put(`/api/meetings/${id}`, data),
  cancel:       id              => api.patch(`/api/meetings/${id}/cancel`),
  delete:       id              => api.delete(`/api/meetings/${id}`),
  respond:      data            => api.post('/api/meetings/respond', data),
};

export const notificationsAPI = {
  getAll:      ()  => api.get('/api/notifications'),
  markRead:    id  => api.patch(`/api/notifications/${id}/read`),
  markAllRead: ()  => api.patch('/api/notifications/read-all'),
};

export const calendarAPI = {
  getGoogleAuthUrl: ()       => api.get('/api/calendar/google/auth-url'),
  connectGoogle:    code     => api.post('/api/calendar/google/connect', { code }),
  sync:             ()       => api.post('/api/calendar/sync'),
  getIntegrations:  ()       => api.get('/api/calendar/integrations'),
  disconnect:       provider => api.delete(`/api/calendar/${provider}/disconnect`),
};

export default api;
