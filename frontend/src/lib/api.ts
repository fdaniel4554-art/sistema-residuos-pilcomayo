import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar errores
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

export default api;

// ==========================================
// AUTH
// ==========================================
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/api/auth/login', { email, password }),

    register: (data: any) =>
        api.post('/api/auth/register', data),

    getProfile: () =>
        api.get('/api/auth/profile'),

    updateProfile: (data: any) =>
        api.put('/api/auth/profile', data),

    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

// ==========================================
// INCIDENTS
// ==========================================
export const incidentsAPI = {
    getAll: (params?: any) =>
        api.get('/api/incidents', { params }),

    getById: (id: string) =>
        api.get(`/api/incidents/${id}`),

    create: (data: any) =>
        api.post('/api/incidents', data),

    updateStatus: (id: string, status: string, notes?: string) =>
        api.patch(`/api/incidents/${id}/status`, { status, notes }),

    assign: (id: string, assignedToId: string, notes?: string) =>
        api.post(`/api/incidents/${id}/assign`, { assignedToId, notes }),

    delete: (id: string) =>
        api.delete(`/api/incidents/${id}`),
};

// ==========================================
// USERS
// ==========================================
export const usersAPI = {
    getAll: (params?: any) =>
        api.get('/api/users', { params }),

    getById: (id: string) =>
        api.get(`/api/users/${id}`),

    create: (data: any) =>
        api.post('/api/users', data),

    update: (id: string, data: any) =>
        api.put(`/api/users/${id}`, data),

    delete: (id: string) =>
        api.delete(`/api/users/${id}`),
};

// ==========================================
// STATS
// ==========================================
export const statsAPI = {
    getGeneral: () =>
        api.get('/api/stats/general'),

    getWasteTypes: () =>
        api.get('/api/stats/waste-types'),

    getSeverity: () =>
        api.get('/api/stats/severity'),

    getTrend: () =>
        api.get('/api/stats/trend'),

    getCriticalPoints: (limit?: number) =>
        api.get('/api/stats/critical-points', { params: { limit } }),

    getBrigadePerformance: () =>
        api.get('/api/stats/brigade-performance'),
};

// ==========================================
// UPLOAD
// ==========================================
export const uploadAPI = {
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteImage: (fileName: string) =>
        api.delete(`/api/upload/${fileName}`),
};

// ==========================================
// ROUTES
// ==========================================
export const routesAPI = {
    optimize: (latitude: number, longitude: number) =>
        api.get('/api/routes/optimize', { params: { latitude, longitude } }),
};

