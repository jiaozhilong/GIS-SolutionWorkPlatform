import axios, { AxiosHeaders, type AxiosError } from 'axios';
import { previewRepository } from '../mocks/previewRepository';
import { useAuthStore } from '../stores/authStore';
import { normalizeArray, normalizeSystemLogPage } from './normalizers';
import { isPreviewMode } from './runtimeMode';

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: number;
  requestId?: string;

  constructor(message: string, details: { status?: number; code?: number; requestId?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = details.status;
    this.code = details.code;
    this.requestId = details.requestId;
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const axiosError = error as AxiosError<ApiResult<unknown>>;
  const result = axiosError.response?.data;
  return new ApiError(
    result?.message || axiosError.message || '请求失败',
    {
      status: axiosError.response?.status,
      code: typeof result?.code === 'number' ? result.code : undefined,
      requestId: result?.requestId
    }
  );
}

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000
});

let unauthorizedRedirectStarted = false;

function handleUnauthorized() {
  if (isPreviewMode() || unauthorizedRedirectStarted) return;
  unauthorizedRedirectStarted = true;
  useAuthStore.getState().clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

apiClient.interceptors.request.use((config) => {
  if (isPreviewMode() && config.url !== '/auth/login') {
    config.headers.delete('Authorization');
    config.adapter = async (adapterConfig) => {
      try {
        const data = previewRepository.request({
          method: adapterConfig.method,
          url: adapterConfig.url,
          data: adapterConfig.data,
          params: adapterConfig.params as Record<string, unknown> | undefined
        });
        return {
          data: {
            code: 0,
            message: 'preview success',
            data,
            requestId: `preview-${Date.now()}`
          },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config: adapterConfig
        };
      } catch (error) {
        throw new ApiError((error as Error).message || '本地预览请求失败');
      }
    };
    return config;
  }

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
      const error = new ApiError(result.message || '请求失败', {
        status: response.status,
        code: result.code,
        requestId: result.requestId
      });
      if (result.code === 401) handleUnauthorized();
      return Promise.reject(error);
    }
    if (result?.code === 0) {
      const path = String(response.config.url || '').split('?')[0];
      const method = String(response.config.method || 'get').toLowerCase();
      if (method === 'get' && path === '/system/logs') {
        const params = response.config.params as { page?: number; pageSize?: number } | undefined;
        result.data = normalizeSystemLogPage(result.data as never, params?.page, params?.pageSize);
      } else if (method === 'get' && (
        ['/projects', '/flows', '/skills', '/templates', '/users', '/ima/config', '/llm/config', '/github/config', '/ppt/records'].includes(path)
        || /^\/flows\/[^/]+\/executions$/.test(path)
        || /^\/projects\/[^/]+\/(flow-executions|ppt)$/.test(path)
        || /^\/github\/repos\/[^/]+\/[^/]+\/tree$/.test(path)
      )) {
        result.data = normalizeArray(result.data as unknown[] | null | undefined);
      }
    }
    return response;
  },
  (error) => {
    const normalized = normalizeApiError(error);
    if (normalized.status === 401 || normalized.code === 401) handleUnauthorized();
    return Promise.reject(normalized);
  }
);
