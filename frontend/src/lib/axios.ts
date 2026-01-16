import axios from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import { useClientAuthStore } from '@/stores/client-auth-store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodavanje tokena
api.interceptors.request.use(
  (config) => {
    // Prvo proveri client token (za client hub)
    const clientToken = useClientAuthStore.getState().clientToken;
    const adminToken = useAuthStore.getState().token;
    
    // Koristi client token za /client-auth/me endpoint i client hub rute
    const isClientRoute = config.url?.includes('/client-auth/me') || 
                          window.location.pathname.startsWith('/client');
    
    const token = isClientRoute && clientToken ? clientToken : adminToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errora
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isClientRoute = window.location.pathname.startsWith('/client');
      
      if (isClientRoute) {
        useClientAuthStore.getState().clientLogout();
        window.location.href = '/client/login';
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
