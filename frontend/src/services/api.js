import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me')
};

// Dashboard API calls
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getReports: (params) => api.get('/dashboard/reports', { params }),
  createReport: (data) => api.post('/dashboard/reports', data),
  getReport: (id) => api.get(`/dashboard/reports/${id}`),
  cancelReport: (id) => api.patch(`/dashboard/reports/${id}/cancel`),
  getLeaderboard: (limit = 10) => api.get('/dashboard/leaderboard', { params: { limit } }),
  updateProfile: (data) => api.patch('/dashboard/profile', data)
};

// Upload API calls
export const uploadAPI = {
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getReports: (params) => api.get('/admin/reports', { params }),
  getReportDetails: (id) => api.get(`/admin/reports/${id}`),
  updateReportStatus: (id, data) => api.patch(`/admin/reports/${id}/status`, data),
  rejectReport: (id, reason) => api.patch(`/admin/reports/${id}/reject`, { reason }),
  getCollectors: () => api.get('/admin/collectors'),
  createCollector: (data) => api.post('/admin/collectors', data)
};

// Collector API calls
export const collectorAPI = {
  getTasks: (params) => api.get('/collector/tasks', { params }),
  completeTask: (id, data) => {
    const formData = new FormData();
    if (data.proof) formData.append('proof', data.proof);
    if (data.note) formData.append('note', data.note);
    return api.post(`/collector/tasks/${id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Reward API calls
export const rewardAPI = {
  getHistory: () => api.get('/rewards/history'),
  getCatalog: (category) => api.get('/rewards/catalog', { params: { category } }),
  redeemPoints: (data) => api.post('/rewards/redeem', data),
  getLeaderboard: (limit = 10) => api.get('/rewards/leaderboard', { params: { limit } }),
  getAdminRedemptions: (params) => api.get('/admin/redemptions', { params }),
  processRedemption: (id, data) => api.patch(`/admin/redemptions/${id}/status`, data)
};

export default api ;


