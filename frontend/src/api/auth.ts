import { apiClient, type ApiResult } from './client';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  userId: string;
  username: string;
  realName?: string;
  role: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  realName?: string;
  role: string;
  status?: string;
  lastLoginAt?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const response = await apiClient.post<ApiResult<LoginResult>>('/auth/login', payload);
  return response.data.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<ApiResult<CurrentUser>>('/auth/me');
  return response.data.data;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
  const response = await apiClient.post<ApiResult<boolean>>('/auth/change-password', { oldPassword, newPassword });
  return response.data.data;
}