import { apiClient, type ApiResult } from './client';

export interface Skill {
  id: string;
  name: string;
  type: string;
  category?: string;
  version?: string;
  description?: string;
  promptTemplate: string;
  inputSchema?: string;
  outputSchema?: string;
  requiresIma?: number;
  requiresLlm?: number;
  requiresGithub?: number;
  imaKbIds?: string;
  llmConfigId?: string;
  timeoutSeconds?: number;
  retryCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SkillPayload = Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>;

export interface SkillTestResult {
  skillId: string;
  skillName: string;
  renderedPrompt: string;
  imaResult?: {
    query: string;
    totalFound: number;
    items: Array<{ id: string; title: string; type: string; score: number; kbId: string; kbName: string }>;
  };
  llmResponse?: string;
  status: string;
  errorMessage?: string;
  durationMs: number;
}

export async function listSkills(): Promise<Skill[]> {
  const response = await apiClient.get<ApiResult<Skill[]>>('/skills');
  return response.data.data;
}

export async function createSkill(payload: SkillPayload): Promise<Skill> {
  const response = await apiClient.post<ApiResult<Skill>>('/skills', payload);
  return response.data.data;
}

export async function updateSkill(id: string, payload: SkillPayload): Promise<Skill> {
  const response = await apiClient.put<ApiResult<Skill>>(`/skills/${id}`, payload);
  return response.data.data;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/skills/${id}`);
  return response.data.data;
}

export async function testSkill(id: string, input: Record<string, unknown>): Promise<SkillTestResult> {
  const response = await apiClient.post<ApiResult<SkillTestResult>>(`/skills/${id}/test`, { input });
  return response.data.data;
}
