import { apiClient, type ApiResult } from './client';
import type { FlowExecution } from './flows';

export interface Project {
  id: string;
  name: string;
  customerName?: string;
  industry?: string;
  gisDomain?: string;
  status?: string;
  priority?: string;
  description?: string;
  githubRepoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectPayload = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export interface PptRecord {
  id: string;
  projectId: string;
  title: string;
  outlineJson?: string;
  contentJson?: string;
  filePath?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listProjects(): Promise<Project[]> {
  const response = await apiClient.get<ApiResult<Project[]>>('/projects');
  return response.data.data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const response = await apiClient.post<ApiResult<Project>>('/projects', payload);
  return response.data.data;
}

export async function updateProject(id: string, payload: ProjectPayload): Promise<Project> {
  const response = await apiClient.put<ApiResult<Project>>(`/projects/${id}`, payload);
  return response.data.data;
}

export async function deleteProject(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/projects/${id}`);
  return response.data.data;
}

export async function runProjectFlow(projectId: string, flowId: string, inputContext: Record<string, unknown>): Promise<FlowExecution> {
  const response = await apiClient.post<ApiResult<FlowExecution>>(`/projects/${projectId}/flows/${flowId}/run`, { inputContext });
  return response.data.data;
}

export async function listProjectFlowExecutions(projectId: string): Promise<FlowExecution[]> {
  const response = await apiClient.get<ApiResult<FlowExecution[]>>(`/projects/${projectId}/flow-executions`);
  return response.data.data;
}

export async function generateProjectPptOutline(projectId: string, title?: string): Promise<PptRecord> {
  const response = await apiClient.post<ApiResult<PptRecord>>(`/projects/${projectId}/ppt/outline/generate`, { title });
  return response.data.data;
}

export async function listProjectPptRecords(projectId: string): Promise<PptRecord[]> {
  const response = await apiClient.get<ApiResult<PptRecord[]>>(`/projects/${projectId}/ppt`);
  return response.data.data;
}
