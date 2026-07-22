import type { ApiResult } from './client';

export interface NormalizedSystemLogPage<T> {
  total: number;
  page: number;
  pageSize: number;
  records: T[];
  logTypeStats: Record<string, number>;
  levelStats: Record<string, number>;
  avgDurationMs: number;
}

export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (!result || result.code !== 0) {
    throw new Error(result?.message || '请求失败');
  }
  return result.data;
}

export function normalizeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeSystemLogPage<T>(
  value: Partial<NormalizedSystemLogPage<T>> | null | undefined,
  requestedPage = 1,
  requestedPageSize = 10
): NormalizedSystemLogPage<T> {
  return {
    total: Number(value?.total) || 0,
    page: Number(value?.page) || requestedPage,
    pageSize: Number(value?.pageSize) || requestedPageSize,
    records: normalizeArray(value?.records),
    logTypeStats: value?.logTypeStats && typeof value.logTypeStats === 'object' ? value.logTypeStats : {},
    levelStats: value?.levelStats && typeof value.levelStats === 'object' ? value.levelStats : {},
    avgDurationMs: Number(value?.avgDurationMs) || 0
  };
}
