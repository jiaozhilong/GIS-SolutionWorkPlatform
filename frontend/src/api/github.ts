import { apiClient, type ApiResult } from './client';
import { normalizeArray } from './normalizers';

export interface GitHubConfig {
  id: string;
  name: string;
  tokenMasked: string;
  username?: string;
  defaultOrg?: string;
  isActive?: number;
  createdAt?: string;
}

export interface GitHubConfigPayload {
  name: string;
  token?: string;
  username?: string;
  defaultOrg?: string;
  isActive?: number;
}

export interface GitHubTestResult {
  connected: boolean;
  latencyMs: number;
  message: string;
  login?: string;
  rateLimitRemaining?: number;
}

export interface GitHubTreeItem {
  path: string;
  type: string;
  size?: number;
  sha?: string;
  url?: string;
}

export interface GitHubFileContent {
  owner: string;
  repo: string;
  path: string;
  name: string;
  sha: string;
  encoding: string;
  content: string;
}

function repoUrl(owner: string, repo: string, suffix: string) {
  return `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

export async function listGitHubConfigs(): Promise<GitHubConfig[]> {
  const response = await apiClient.get<ApiResult<GitHubConfig[]>>('/github/config');
  return normalizeArray(response.data.data);
}

export async function createGitHubConfig(payload: GitHubConfigPayload): Promise<GitHubConfig> {
  const response = await apiClient.post<ApiResult<GitHubConfig>>('/github/config', payload);
  return response.data.data;
}

export async function updateGitHubConfig(id: string, payload: GitHubConfigPayload): Promise<GitHubConfig> {
  const response = await apiClient.put<ApiResult<GitHubConfig>>(`/github/config/${id}`, payload);
  return response.data.data;
}

export async function deleteGitHubConfig(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/github/config/${id}`);
  return response.data.data;
}

export async function testGitHubConfig(id: string): Promise<GitHubTestResult> {
  const response = await apiClient.post<ApiResult<GitHubTestResult>>(`/github/config/${id}/test`);
  return response.data.data || {
    connected: false,
    latencyMs: 0,
    message: '测试接口未返回结果'
  };
}

export async function readGitHubReadme(owner: string, repo: string): Promise<string> {
  const response = await apiClient.get<ApiResult<string>>(repoUrl(owner, repo, '/readme'));
  return response.data.data || '';
}

export async function readGitHubTree(owner: string, repo: string): Promise<GitHubTreeItem[]> {
  const response = await apiClient.get<ApiResult<GitHubTreeItem[]>>(repoUrl(owner, repo, '/tree'));
  return normalizeArray(response.data.data);
}

export async function readGitHubFile(owner: string, repo: string, path: string): Promise<GitHubFileContent> {
  const response = await apiClient.get<ApiResult<GitHubFileContent>>(repoUrl(owner, repo, '/file'), { params: { path } });
  return response.data.data;
}
