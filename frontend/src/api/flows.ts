import { apiClient, type ApiResult } from './client';

export interface FlowNodePayload {
  clientId?: string;
  skillId: string;
  nodeName: string;
  positionX?: number;
  positionY?: number;
  paramOverrides?: string;
  timeoutSeconds?: number;
  retryCount?: number;
}

export interface FlowEdgePayload {
  sourceNodeId: string;
  targetNodeId: string;
}

export interface FlowPayload {
  name: string;
  description?: string;
  category?: string;
  version?: string;
  status?: string;
  nodes?: FlowNodePayload[];
  edges?: FlowEdgePayload[];
}

export interface FlowNode extends FlowNodePayload {
  id: string;
  flowId: string;
}

export interface FlowEdge extends FlowEdgePayload {
  id: string;
  flowId: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowExecution {
  id: string;
  flowId: string;
  flowVersion?: string;
  projectId?: string;
  triggerType?: string;
  inputContext?: string;
  outputContext?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

export async function listFlows(): Promise<Flow[]> {
  const response = await apiClient.get<ApiResult<Flow[]>>('/flows');
  return response.data.data;
}

export async function createFlow(payload: FlowPayload): Promise<Flow> {
  const response = await apiClient.post<ApiResult<Flow>>('/flows', payload);
  return response.data.data;
}

export async function updateFlow(id: string, payload: FlowPayload): Promise<Flow> {
  const response = await apiClient.put<ApiResult<Flow>>(`/flows/${id}`, payload);
  return response.data.data;
}

export async function deleteFlow(id: string): Promise<boolean> {
  const response = await apiClient.delete<ApiResult<boolean>>(`/flows/${id}`);
  return response.data.data;
}

export async function executeFlow(id: string, inputContext: Record<string, unknown>): Promise<FlowExecution> {
  const response = await apiClient.post<ApiResult<FlowExecution>>(`/flows/${id}/execute`, { inputContext });
  return response.data.data;
}

export async function listFlowExecutions(id: string): Promise<FlowExecution[]> {
  const response = await apiClient.get<ApiResult<FlowExecution[]>>(`/flows/${id}/executions`);
  return response.data.data;
}
