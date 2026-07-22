import { apiClient, type ApiResult } from './client';
import { normalizeArray } from './normalizers';

export interface Template {
  id: string;
  name: string;
  type: string;
  category?: string;
  content: string;
  variablesJson?: string;
  isSystem?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type TemplatePayload = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

export interface TemplateQuery {
  type?: string;
  category?: string;
  keyword?: string;
}

export async function listTemplates(params?: TemplateQuery): Promise<Template[]> {
  const response = await apiClient.get<ApiResult<Template[]>>('/templates', { params });
  return normalizeArray(response.data.data);
}

export async function createTemplate(payload: TemplatePayload): Promise<Template> {
  const response = await apiClient.post<ApiResult<Template>>('/templates', payload);
  return response.data.data;
}

export async function updateTemplate(id: string, payload: TemplatePayload): Promise<Template> {
  const response = await apiClient.put<ApiResult<Template>>(`/templates/${id}`, payload);
  return response.data.data;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/templates/${id}`);
  return response.data.data;
}
