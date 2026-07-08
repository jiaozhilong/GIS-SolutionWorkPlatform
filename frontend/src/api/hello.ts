import { apiClient, type ApiResult } from './client';

export async function getHello(): Promise<string> {
  const response = await apiClient.get<ApiResult<string>>('/hello');
  return response.data.data;
}

