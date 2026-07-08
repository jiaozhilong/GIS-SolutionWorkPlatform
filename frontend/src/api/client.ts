import axios from 'axios';

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

apiClient.interceptors.response.use((response) => {
  const result = response.data as ApiResult<unknown>;
  if (typeof result?.code === 'number' && result.code !== 0) {
    return Promise.reject(new Error(result.message || '请求失败'));
  }
  return response;
});

