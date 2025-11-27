import { create } from 'zustand';
import { authAPI } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (data: any) => Promise<User>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        try {
            const response = await authAPI.login(email, password);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true });
            return user;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
        }
    },

    register: async (data) => {
        try {
            const response = await authAPI.register(data);
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, token, isAuthenticated: true });
            return user;
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Error al registrarse');
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            set({ isLoading: false });
        }
    },
}));
