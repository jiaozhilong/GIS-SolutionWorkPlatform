import { apiClient, type ApiResult } from './client';

export interface LlmConfig {
  id: string;
  name: string;
  apiBase: string;
  apiKeyMasked: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  timeoutSeconds?: number;
  usageScene?: string;
  isActive?: number;
  createdAt?: string;
}

export interface LlmConfigPayload {
  name: string;
  apiBase: string;
  apiKey?: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutSeconds?: number;
  usageScene?: string;
  isActive?: number;
}

export interface LlmTestResult {
  connected: boolean;
  latencyMs: number;
  message: string;
  responsePreview?: string;
}

export async function listLlmConfigs(): Promise<LlmConfig[]> {
  const response = await apiClient.get<ApiResult<LlmConfig[]>>('/llm/config');
  return response.data.data;
}

export async function createLlmConfig(payload: LlmConfigPayload): Promise<LlmConfig> {
  const response = await apiClient.post<ApiResult<LlmConfig>>('/llm/config', payload);
  return response.data.data;
}

export async function updateLlmConfig(id: string, payload: LlmConfigPayload): Promise<LlmConfig> {
  const response = await apiClient.put<ApiResult<LlmConfig>>(`/llm/config/${id}`, payload);
  return response.data.data;
}

export async function deleteLlmConfig(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/llm/config/${id}`);
  return response.data.data;
}

export async function testLlmConfig(id: string): Promise<LlmTestResult> {
  const response = await apiClient.post<ApiResult<LlmTestResult>>(`/llm/config/${id}/test`);
  return response.data.data;
}

