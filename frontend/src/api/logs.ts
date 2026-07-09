import { apiClient, type ApiResult } from './client';

export interface SystemLog {
  id: string;
  module?: string;
  action?: string;
  refId?: string;
  logType?: string;
  level?: string;
  message?: string;
  detail?: string;
  durationMs?: number;
  createdAt?: string;
}

export interface SystemLogPage {
  total: number;
  page: number;
  pageSize: number;
  records: SystemLog[];
  logTypeStats: Record<string, number>;
  levelStats: Record<string, number>;
  avgDurationMs: number;
}

export interface SystemLogQuery {
  logType?: string;
  level?: string;
  module?: string;
  action?: string;
  keyword?: string;
  startAt?: string;
  endAt?: string;
  page?: number;
  pageSize?: number;
}

export async function listSystemLogs(params: SystemLogQuery): Promise<SystemLogPage> {
  const response = await apiClient.get<ApiResult<SystemLogPage>>('/system/logs', { params });
  return response.data.data;
}