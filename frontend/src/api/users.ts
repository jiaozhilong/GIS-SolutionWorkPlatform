import { apiClient, type ApiResult } from './client';
import { normalizeArray } from './normalizers';

export interface UserAccount {
  id: string;
  username: string;
  realName?: string;
  role: 'ADMIN' | 'ENGINEER' | string;
  status?: 'ACTIVE' | 'DISABLED' | string;
  lastLoginAt?: string;
}

export interface UserQuery {
  keyword?: string;
  role?: string;
  status?: string;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  realName?: string;
  role: string;
  status?: string;
}

export interface UserUpdatePayload {
  realName: string;
  role: string;
  status: string;
}

export async function listUsers(params?: UserQuery): Promise<UserAccount[]> {
  const response = await apiClient.get<ApiResult<UserAccount[]>>('/users', { params });
  return normalizeArray(response.data.data);
}

export async function createUser(payload: UserCreatePayload): Promise<UserAccount> {
  const response = await apiClient.post<ApiResult<UserAccount>>('/users', payload);
  return response.data.data;
}

export async function updateUser(id: string, payload: UserUpdatePayload): Promise<UserAccount> {
  const response = await apiClient.put<ApiResult<UserAccount>>(`/users/${id}`, payload);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/users/${id}`);
  return response.data.data;
}

export async function resetUserPassword(id: string, newPassword: string): Promise<boolean> {
  const response = await apiClient.post<ApiResult<boolean>>(`/users/${id}/reset-password`, { newPassword });
  return response.data.data;
}
