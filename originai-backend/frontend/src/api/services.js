import api from './client';

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ── Analysis ─────────────────────────────────────────────────
export const analysisAPI = {
  submit: (formData) =>
    api.post('/analysis/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  submitText: (data) => api.post('/analysis/submit', data),
  getStatus: (id) => api.get(`/analysis/${id}/status`),
  getOne: (id) => api.get(`/analysis/${id}`),
  getAll: (params) => api.get('/analysis', { params }),
  deleteOne: (id) => api.delete(`/analysis/${id}`),
  exportReport: (id) => api.get(`/analysis/${id}/export`),
};

// ── Patents ──────────────────────────────────────────────────
export const patentsAPI = {
  getAll: (params) => api.get('/patents', { params }),
  getOne: (id) => api.get(`/patents/${id}`),
};

// ── Papers ───────────────────────────────────────────────────
export const papersAPI = {
  getAll: (params) => api.get('/papers', { params }),
  getStats: () => api.get('/papers/stats'),
};

// ── Dashboard ────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ── Users ────────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  deleteAccount: () => api.delete('/users/profile'),
};
