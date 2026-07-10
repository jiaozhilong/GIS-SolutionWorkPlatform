import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const result = response.data as ApiResult<unknown>;
    if (typeof result?.code === 'number' && result.code !== 0) {
      if (result.code === 401) {
        useAuthStore.getState().clearAuth();
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
      return Promise.reject(new Error(result.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);