import { apiClient, type ApiResult } from './client';
import type { PptRecord } from './projects';
import { normalizeArray } from './normalizers';

export interface PptGeneratePayload {
  projectId: string;
  executionId?: string;
  title?: string;
}

export interface PptRecordPayload {
  title: string;
  outlineJson?: string;
  contentJson?: string;
  status?: string;
}

export async function generatePptContent(payload: PptGeneratePayload): Promise<PptRecord> {
  const response = await apiClient.post<ApiResult<PptRecord>>('/ppt/generate', payload);
  return response.data.data;
}

export async function listPptRecords(projectId?: string): Promise<PptRecord[]> {
  const response = await apiClient.get<ApiResult<PptRecord[]>>('/ppt/records', { params: { projectId } });
  return normalizeArray(response.data.data);
}

export async function getPptRecord(id: string): Promise<PptRecord> {
  const response = await apiClient.get<ApiResult<PptRecord>>(`/ppt/records/${id}`);
  return response.data.data;
}

export async function updatePptRecord(id: string, payload: PptRecordPayload): Promise<PptRecord> {
  const response = await apiClient.put<ApiResult<PptRecord>>(`/ppt/records/${id}`, payload);
  return response.data.data;
}
