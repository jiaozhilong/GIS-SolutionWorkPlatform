import { apiClient, type ApiResult } from './client';
import { normalizeArray } from './normalizers';

export interface ImaConfig {
  id: string;
  name: string;
  apiKeyMasked: string;
  kbId?: string;
  kbName?: string;
  kbType?: string;
  industryTag?: string;
  isDefault?: number;
  isActive?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImaConfigPayload {
  name: string;
  apiKey?: string;
  kbId?: string;
  kbName?: string;
  kbType?: string;
  industryTag?: string;
  isDefault?: number;
  isActive?: number;
}

export interface ImaSearchItem {
  id: string;
  title: string;
  type: string;
  score: number;
  kbId: string;
  kbName: string;
}

export interface ImaSearchResult {
  query: string;
  totalFound: number;
  items: ImaSearchItem[];
}

export async function listImaConfigs(): Promise<ImaConfig[]> {
  const response = await apiClient.get<ApiResult<ImaConfig[]>>('/ima/config');
  return normalizeArray(response.data.data);
}

export async function createImaConfig(payload: ImaConfigPayload): Promise<ImaConfig> {
  const response = await apiClient.post<ApiResult<ImaConfig>>('/ima/config', payload);
  return response.data.data;
}

export async function updateImaConfig(id: string, payload: ImaConfigPayload): Promise<ImaConfig> {
  const response = await apiClient.put<ApiResult<ImaConfig>>(`/ima/config/${id}`, payload);
  return response.data.data;
}

export async function deleteImaConfig(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/ima/config/${id}`);
  return response.data.data;
}

export async function testImaConfig(id: string): Promise<boolean> {
  const response = await apiClient.post<ApiResult<boolean>>(`/ima/config/${id}/test`);
  return response.data.data;
}

export async function searchIma(kbIds: string[], query: string): Promise<ImaSearchResult> {
  const response = await apiClient.post<ApiResult<ImaSearchResult>>('/ima/search', { kbIds, query });
  return {
    query: response.data.data?.query || query,
    totalFound: response.data.data?.totalFound || 0,
    items: normalizeArray(response.data.data?.items)
  };
}
