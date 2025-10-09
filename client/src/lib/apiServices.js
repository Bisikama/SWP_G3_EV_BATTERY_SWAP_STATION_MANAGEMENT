// API service functions

import { api } from './api';

// Authentication APIs
export const authAPI = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
    logout: () => api.post('/api/auth/logout'),
    getProfile: () => api.get('/api/auth/profile'),
};

// EV APIs
export const vehicleAPI = {
    getAll: () => api.get('/api/EV'),
    getById: (id) => api.get(`/api/EV/${id}`),
    create: (data) => api.post('/api/EV', data),
    update: (id, data) => api.put(`/api/EV/${id}`, data),
    delete: (id) => api.delete(`/api/EV/${id}`),
};

// Customer APIs
export const customerAPI = {
    getAll: (params) => api.get('/api/customers', { params }),
    getById: (id) => api.get(`/api/customers/${id}`),
    create: (data) => api.post('/api/customers', data),
    update: (id, data) => api.put(`/api/customers/${id}`, data),
    delete: (id) => api.delete(`/api/customers/${id}`),
};


