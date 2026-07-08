import { apiClient, type ApiResult } from './client';

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
