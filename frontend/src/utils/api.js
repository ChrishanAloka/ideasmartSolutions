import axios from 'axios';

const API_URL = 'https://ideasmartsolutions.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Main Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  updateStatus: (id) => api.put(`/projects/${id}/update-status`)
};

// Sub Projects API
export const subProjectsAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/subprojects`),
  getOne: (id) => api.get(`/subprojects/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/subprojects`, data),
  update: (id, data) => api.put(`/subprojects/${id}`, data),
  delete: (id) => api.delete(`/subprojects/${id}`)
};

// Payments API
export const paymentsAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/payments`),
  getOne: (id) => api.get(`/payments/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/payments`, data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`)
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getStats: () => api.get('/tasks/stats')
};

// Subscription Invoices API
export const subscriptionInvoicesAPI = {
  getOne: (id) => api.get(`/subscription-invoices/${id}`),
  getAllForProject: (projectId) => api.get(`/projects/${projectId}/subscription-invoices`),
  getAllForSubProject: (subProjectId) => api.get(`/subprojects/${subProjectId}/subscription-invoices`),
  create: (data) => api.post('/subscription-invoices', data),
  update: (id, data) => api.put(`/subscription-invoices/${id}`, data),
  delete: (id) => api.delete(`/subscription-invoices/${id}`),
  generateNext: (subProjectId) => api.post(`/subprojects/${subProjectId}/generate-invoice`)
};

// Invoices API
export const invoicesAPI = {
  create: (projectId, type) => api.post('/invoices', { projectId, type }),
  getOne: (id) => api.get(`/invoices/${id}`),
  delete: (id) => api.delete(`/invoices/${id}`),
  getAllForProject: (projectId) => api.get(`/invoices/project/${projectId}`)
};

export default api;