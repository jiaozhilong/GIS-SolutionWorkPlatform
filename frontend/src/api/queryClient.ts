import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 1) return false;
  const apiError = error as Partial<ApiError>;
  if (apiError.status === 401 || apiError.status === 403 || apiError.code === 401 || apiError.code === 403) return false;
  if (apiError.status && apiError.status < 500) return false;
  if (apiError.code && apiError.code !== 0) return false;
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
});
