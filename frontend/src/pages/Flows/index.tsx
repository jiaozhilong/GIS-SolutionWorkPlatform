import {
  DeleteOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  createFlow,
  deleteFlow,
  executeFlow,
  listFlowExecutions,
  listFlows,
  updateFlow,
  type Flow,
  type FlowEdgePayload,
  type FlowExecution,
  type FlowNodePayload,
  type FlowPayload
} from '../../api/flows';
import { listSkills, type Skill } from '../../api/skills';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

const { TextArea } = Input;

type RuntimeStatus = 'idle' | 'running' | 'success' | 'failed';

interface DraftNode extends FlowNodePayload {
  id?: string;
  clientId: string;
}

interface DraftFlow {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  status?: string;
  nodes: DraftNode[];
  edges: FlowEdgePayload[];
}

const stageNames = ['需求分析', '产品匹配', '案例检索', '架构设计', '方案撰写', 'PPT 生成'];
const defaultInputJson = '{\n  "projectName": "智慧园区三维可视化平台",\n  "industry": "智慧园区",\n  "query": "三维 GIS、空间分析、方案交付"\n}';

function nodeRef(node: Pick<DraftNode, 'clientId' | 'id'>) {
  return node.clientId || node.id || '';
}

function makeClientId(index: number) {
  return `node-${index + 1}`;
}

function makeDraftFromFlow(flow: Flow): DraftFlow {
  const nodes = (flow.nodes || []).map((node, index) => ({
    id: node.id,
    clientId: node.clientId || node.id || makeClientId(index),
    skillId: node.skillId,
    nodeName: node.nodeName,
    positionX: node.positionX ?? 140 + index * 142,
    positionY: node.positionY ?? (index % 2 === 0 ? 118 : 238),
    paramOverrides: node.paramOverrides || '{}',
    timeoutSeconds: node.timeoutSeconds ?? 60,
    retryCount: node.retryCount ?? 0
  }));

  return {
    id: flow.id,
    name: flow.name,
    description: flow.description,
    category: flow.category || 'Solution',
    version: flow.version || '1.0.0',
    status: flow.status || 'ACTIVE',
    nodes,
    edges: flow.edges || []
  };
}

function makeDefaultDraft(skills: Skill[]): DraftFlow {
  const usableSkills = skills.length ? skills : [{ id: '', name: '请先创建 Skill', type: 'PROMPT', promptTemplate: '' } as Skill];
  const nodes = stageNames.map((name, index) => ({
    clientId: makeClientId(index),
    skillId: usableSkills[index % usableSkills.length].id,
    nodeName: name,
    positionX: 132 + index * 150,
    positionY: index < 3 ? 104 : 244,
    paramOverrides: '{}',
    timeoutSeconds: 60,
    retryCount: 0
  }));

  return {
    name: 'GIS Solution Delivery Flow',
    description: '从客户需求到方案交付的 GIS AI 编排流程。',
    category: 'Solution',
    version: '1.0.0',
    status: 'ACTIVE',
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({
      sourceNodeId: node.clientId,
      targetNodeId: nodes[index + 1].clientId
    }))
  };
}

function toPayload(draft: DraftFlow): FlowPayload {
  const nodeIdToClientId = new Map<string, string>();
  draft.nodes.forEach((node) => {
    if (node.id) nodeIdToClientId.set(node.id, node.clientId);
    nodeIdToClientId.set(node.clientId, node.clientId);
  });

  return {
    name: draft.name,
    description: draft.description,
    category: draft.category,
    version: draft.version,
    status: draft.status,
    nodes: draft.nodes.map((node) => ({
      clientId: node.clientId,
      skillId: node.skillId,
      nodeName: node.nodeName,
      positionX: node.positionX,
      positionY: node.positionY,
      paramOverrides: node.paramOverrides,
      timeoutSeconds: node.timeoutSeconds,
      retryCount: node.retryCount
    })),
    edges: draft.edges.map((edge) => ({
      sourceNodeId: nodeIdToClientId.get(edge.sourceNodeId) || edge.sourceNodeId,
      targetNodeId: nodeIdToClientId.get(edge.targetNodeId) || edge.targetNodeId
    }))
  };
}

function stringifyDraft(draft: DraftFlow) {
  return JSON.stringify(toPayload(draft), null, 2);
}

function parseFlowPayloadJson(value: string, previous: DraftFlow): DraftFlow | null {
  const parsed = JSON.parse(value || '{}') as FlowPayload;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (!parsed.name) throw new Error('FlowPayload.name 不能为空');
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
  return {
    ...previous,
    name: parsed.name,
    description: parsed.description,
    category: parsed.category,
    version: parsed.version,
    status: parsed.status,
    nodes: nodes.map((node, index) => ({
      ...node,
      clientId: node.clientId || previous.nodes[index]?.clientId || makeClientId(index),
      paramOverrides: node.paramOverrides || '{}',
      timeoutSeconds: node.timeoutSeconds ?? 60,
      retryCount: node.retryCount ?? 0
    })),
    edges
  };
}

function executionTone(status?: string): 'green' | 'cyan' | 'red' | 'muted' {
  if (status === 'SUCCESS') return 'green';
  if (status === 'FAILED') return 'red';
  if (status === 'RUNNING') return 'cyan';
  return 'muted';
}

function shortJson(value?: string) {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function FlowCanvas({
  draft,
  selectedNodeId,
  runtimeStatus,
  onSelect
}: {
  draft: DraftFlow;
  selectedNodeId?: string;
  runtimeStatus: RuntimeStatus;
  onSelect: (nodeId: string) => void;
}) {
  const virtualStart = { id: 'virtual-start', name: '开始', x: 26, y: 174 };
  const virtualEnd = { id: 'virtual-end', name: '结束', x: 1048, y: 174 };
  const nodes = draft.nodes;
  const nodeLookup = new Map(nodes.map((node) => [nodeRef(node), node]));

  const pointOf = (id: string) => {
    if (id === virtualStart.id) return { x: virtualStart.x + 92, y: virtualStart.y + 28 };
    if (id === virtualEnd.id) return { x: virtualEnd.x, y: virtualEnd.y + 28 };
    const node = nodeLookup.get(id);
    return { x: (node?.positionX || 0) + 92, y: (node?.positionY || 0) + 28 };
  };

  const visualEdges = [
    ...(nodes[0] ? [{ sourceNodeId: virtualStart.id, targetNodeId: nodeRef(nodes[0]) }] : []),
    ...draft.edges,
    ...(nodes[nodes.length - 1] ? [{ sourceNodeId: nodeRef(nodes[nodes.length - 1]), targetNodeId: virtualEnd.id }] : [])
  ];

  return (
    <div className={`flow-orchestration-canvas is-${runtimeStatus}`}>
      <div className="flow-grid-layer" />
      <div className="flow-virtual-node" style={{ left: virtualStart.x, top: virtualStart.y }}>{virtualStart.name}</div>
      <div className="flow-virtual-node is-end" style={{ left: virtualEnd.x, top: virtualEnd.y }}>{virtualEnd.name}</div>
      <svg className="flow-edge-layer" viewBox="0 0 1160 420" preserveAspectRatio="none">
        {visualEdges.map((edge, index) => {
          const from = pointOf(edge.sourceNodeId);
          const to = pointOf(edge.targetNodeId);
          const mid = Math.max(48, Math.abs(to.x - from.x) / 2);
          const path = `M ${from.x} ${from.y} C ${from.x + mid} ${from.y}, ${to.x - mid} ${to.y}, ${to.x} ${to.y}`;
          return (
            <path key={`${edge.sourceNodeId}-${edge.targetNodeId}-${index}`} d={path} className="flow-edge-path" />
          );
        })}
      </svg>
      {nodes.map((node, index) => {
        const id = nodeRef(node);
        const isActive = selectedNodeId === id;
        const isRunning = runtimeStatus === 'running' && index <= Math.min(2, nodes.length - 1);
        const isSuccess = runtimeStatus === 'success';
        const isFailed = runtimeStatus === 'failed' && index === 0;
        return (
          <button
            type="button"
            key={id}
            className={`flow-dag-node${isActive ? ' is-active' : ''}${isRunning ? ' is-running' : ''}${isSuccess ? ' is-success' : ''}${isFailed ? ' is-failed' : ''}`}
            style={{ left: node.positionX || 0, top: node.positionY || 0 }}
            onClick={() => onSelect(id)}
          >
            <NodeIndexOutlined />
            <strong>{node.nodeName}</strong>
            <span>{node.skillId ? `Skill ${node.skillId.slice(0, 8)}` : '未绑定 Skill'}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FlowManagerPage() {
  const [executeForm] = Form.useForm<{ inputJson: string }>();
  const queryClient = useQueryClient();
  const [selectedFlowId, setSelectedFlowId] = useState<string>();
  const [draft, setDraft] = useState<DraftFlow>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonError, setJsonError] = useState<string>();
  const [executionResult, setExecutionResult] = useState<FlowExecution | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>('idle');
  const [fullscreen, setFullscreen] = useState(false);

  const flowsQuery = useQuery({ queryKey: ['flows'], queryFn: listFlows });
  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: listSkills });
  const flows = flowsQuery.data || [];
  const skills = skillsQuery.data || [];
  const activeFlow = flows.find((flow) => flow.id === selectedFlowId);

  const executionsQuery = useQuery({
    queryKey: ['flow-executions', draft?.id],
    queryFn: () => listFlowExecutions(draft!.id!),
    enabled: !!draft?.id
  });

  useEffect(() => {
    if (!selectedFlowId && !draft && flows[0]?.id) setSelectedFlowId(flows[0].id);
  }, [draft, flows, selectedFlowId]);

  useEffect(() => {
    if (activeFlow) {
      const next = makeDraftFromFlow(activeFlow);
      setDraft(next);
      setJsonDraft(stringifyDraft(next));
      setSelectedNodeId(nodeRef(next.nodes[0] || { clientId: '' }));
      setJsonError(undefined);
      setExecutionResult(null);
      setRuntimeStatus('idle');
    }
  }, [activeFlow?.id, activeFlow?.updatedAt]);

  const selectedNode = draft?.nodes.find((node) => nodeRef(node) === selectedNodeId);
  const skillOptions = skills.map((skill) => ({ label: skill.name, value: skill.id }));

  const stats = useMemo(() => [
    { label: '流程总数', value: flows.length, helper: '可复用交付链路', tone: 'cyan' as const },
    { label: '启用流程', value: flows.filter((item) => item.status !== 'DISABLED').length, helper: '可直接执行', tone: 'green' as const },
    { label: '节点总数', value: flows.reduce((sum, item) => sum + (item.nodes?.length || 0), 0), helper: 'Agent 编排节点', tone: 'blue' as const },
    { label: '连线总数', value: flows.reduce((sum, item) => sum + (item.edges?.length || 0), 0), helper: 'DAG 依赖关系', tone: 'amber' as const }
  ], [flows]);

  const updateDraft = (next: DraftFlow) => {
    setDraft(next);
    setJsonDraft(stringifyDraft(next));
    setJsonError(undefined);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error('暂无可保存的流程');
      const payload = toPayload(draft);
      return draft.id ? updateFlow(draft.id, payload) : createFlow(payload);
    },
    onSuccess: (flow) => {
      message.success(draft?.id ? '流程已保存' : '流程已创建');
      setSelectedFlowId(flow.id);
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFlow,
    onSuccess: (_, id) => {
      message.success('流程已删除');
      if (selectedFlowId === id || draft?.id === id) {
        setSelectedFlowId(undefined);
        setDraft(undefined);
        setSelectedNodeId(undefined);
      }
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => executeFlow(id, input),
    onMutate: () => {
      setRuntimeStatus('running');
      setExecutionResult(null);
    },
    onSuccess: (result) => {
      setExecutionResult(result);
      setRuntimeStatus(result.status === 'SUCCESS' ? 'success' : result.status === 'FAILED' ? 'failed' : 'idle');
      message.success(`流程执行完成：${result.status}`);
      if (draft?.id) queryClient.invalidateQueries({ queryKey: ['flow-executions', draft.id] });
    },
    onError: (error) => {
      setRuntimeStatus('failed');
      message.error((error as Error).message);
    }
  });

  const createDraft = () => {
    const next = makeDefaultDraft(skills);
    setSelectedFlowId(undefined);
    setExecutionResult(null);
    updateDraft(next);
    setSelectedNodeId(nodeRef(next.nodes[0]));
  };

  const addNode = (skill?: Skill) => {
    if (!draft) return;
    const index = draft.nodes.length;
    const node: DraftNode = {
      clientId: `node-${Date.now()}`,
      skillId: skill?.id || skills[0]?.id || '',
      nodeName: skill?.name || `新增节点 ${index + 1}`,
      positionX: 140 + (index % 4) * 170,
      positionY: index % 2 === 0 ? 104 : 244,
      paramOverrides: '{}',
      timeoutSeconds: 60,
      retryCount: 0
    };
    const previous = draft.nodes[draft.nodes.length - 1];
    const next = {
      ...draft,
      nodes: [...draft.nodes, node],
      edges: previous ? [...draft.edges, { sourceNodeId: nodeRef(previous), targetNodeId: node.clientId }] : draft.edges
    };
    updateDraft(next);
    setSelectedNodeId(node.clientId);
  };

  const updateSelectedNode = (patch: Partial<DraftNode>) => {
    if (!draft || !selectedNode) return;
    const next = {
      ...draft,
      nodes: draft.nodes.map((node) => nodeRef(node) === nodeRef(selectedNode) ? { ...node, ...patch } : node)
    };
    updateDraft(next);
  };

  const applyJsonDraft = () => {
    if (!draft) return;
    try {
      const next = parseFlowPayloadJson(jsonDraft, draft);
      if (!next) throw new Error('JSON 必须是 FlowPayload 对象');
      updateDraft(next);
      setSelectedNodeId(nodeRef(next.nodes[0] || { clientId: '' }));
      message.success('JSON 已同步到画布');
    } catch (error) {
      setJsonError((error as Error).message);
      message.error(`JSON 解析失败：${(error as Error).message}`);
    }
  };

  const runFlow = (values: { inputJson: string }) => {
    if (!draft?.id) {
      message.warning('请先保存流程，再执行');
      return;
    }
    try {
      const input = JSON.parse(values.inputJson || '{}') as Record<string, unknown>;
      executeMutation.mutate({ id: draft.id, input });
    } catch {
      message.error('执行输入必须是合法 JSON');
    }
  };

  return (
    <Space direction="vertical" size={16} className={`content-stack gis-page flow-orchestration-page${fullscreen ? ' is-fullscreen' : ''}`}>
      <PageHeader
        eyebrow="FLOW ORCHESTRATION"
        title="流程编排"
        description="编排从客户需求到方案交付的 Agent DAG 流程。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => flowsQuery.refetch()}>刷新</Button>,
          <Button key="new" icon={<PlusOutlined />} disabled={skillsQuery.isSuccess && skills.length === 0} onClick={createDraft}>新建</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} disabled={!draft || draft.nodes.length === 0} onClick={() => saveMutation.mutate()}>保存</Button>,
          <Button key="run" icon={<PlayCircleOutlined />} loading={executeMutation.isPending} disabled={!draft?.id} onClick={() => executeForm.submit()}>运行</Button>,
          <Button key="fullscreen" icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setFullscreen((value) => !value)} />
        ]}
      />

      {skillsQuery.isSuccess && skills.length === 0 && <Alert type="warning" showIcon message="请先在 Agent 技能中创建至少一个 Skill，再编排流程。" />}
      <StatGrid items={stats} />

      {flowsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {flowsQuery.isError && <Result status="error" title="流程列表加载失败" subTitle={(flowsQuery.error as Error).message} extra={<Button onClick={() => flowsQuery.refetch()}>重试</Button>} />}

      {!draft && flowsQuery.isSuccess && (
        <Card><Empty description="还没有流程"><Button type="primary" icon={<PlusOutlined />} disabled={skills.length === 0} onClick={createDraft}>创建第一个流程</Button></Empty></Card>
      )}

      {draft && (
        <section className="flow-builder-shell">
          <aside className="flow-left-panel">
            <Card title="流程列表" className="flow-panel-card">
              <Space direction="vertical" className="content-stack" size={8}>
                {flows.map((flow) => (
                  <button key={flow.id} type="button" className={`flow-list-item${flow.id === draft.id ? ' is-active' : ''}`} onClick={() => setSelectedFlowId(flow.id)}>
                    <strong>{flow.name}</strong>
                    <span>{flow.version || '1.0.0'} · {flow.status || 'ACTIVE'} · {flow.nodes?.length || 0} 节点</span>
                  </button>
                ))}
              </Space>
            </Card>
            <Card title="可用节点库" className="flow-panel-card">
              <Space direction="vertical" className="content-stack" size={8}>
                {skills.map((skill) => (
                  <button key={skill.id} type="button" className="flow-skill-item" onClick={() => addNode(skill)}>
                    <NodeIndexOutlined />
                    <span><strong>{skill.name}</strong><small>{skill.type}</small></span>
                  </button>
                ))}
                {skills.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Skill" />}
              </Space>
            </Card>
          </aside>

          <main className="flow-center-panel">
            <div className="flow-titlebar">
              <Space wrap>
                <Input value={draft.name} onChange={(event) => updateDraft({ ...draft, name: event.target.value })} className="flow-title-input" />
                <Select value={draft.status || 'ACTIVE'} onChange={(value) => updateDraft({ ...draft, status: value })} options={[{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }]} />
                <Tag color={draft.id ? 'green' : 'orange'}>{draft.id ? '已保存流程' : '未保存草稿'}</Tag>
              </Space>
              {draft.id && (
                <Popconfirm title="确认删除这个流程？" onConfirm={() => deleteMutation.mutate(draft.id!)}>
                  <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>删除</Button>
                </Popconfirm>
              )}
            </div>
            <FlowCanvas draft={draft} selectedNodeId={selectedNodeId} runtimeStatus={runtimeStatus} onSelect={setSelectedNodeId} />
          </main>

          <aside className="flow-right-panel">
            <Card title="节点属性" className="flow-panel-card">
              {selectedNode ? (
                <Space direction="vertical" size={12} className="content-stack">
                  <label className="flow-field"><span>节点名称</span><Input value={selectedNode.nodeName} onChange={(event) => updateSelectedNode({ nodeName: event.target.value })} /></label>
                  <label className="flow-field"><span>Skill</span><Select value={selectedNode.skillId} options={skillOptions} onChange={(value) => updateSelectedNode({ skillId: value })} /></label>
                  <label className="flow-field"><span>超时（秒）</span><InputNumber className="full-width" min={5} max={600} value={selectedNode.timeoutSeconds} onChange={(value) => updateSelectedNode({ timeoutSeconds: Number(value) || 60 })} /></label>
                  <label className="flow-field"><span>重试</span><InputNumber className="full-width" min={0} max={5} value={selectedNode.retryCount} onChange={(value) => updateSelectedNode({ retryCount: Number(value) || 0 })} /></label>
                  <label className="flow-field"><span>参数覆盖</span><TextArea rows={7} value={selectedNode.paramOverrides} onChange={(event) => updateSelectedNode({ paramOverrides: event.target.value })} /></label>
                  <Alert type="info" showIcon message="节点 ID" description={nodeRef(selectedNode)} />
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择画布节点" />
              )}
            </Card>
          </aside>

          <section className="flow-bottom-panel">
            <Tabs
              items={[
                {
                  key: 'run',
                  label: '运行状态',
                  children: (
                    <div className="flow-run-grid">
                      <Card title="输入上下文" className="flow-panel-card">
                        <Form form={executeForm} layout="vertical" onFinish={runFlow} initialValues={{ inputJson: defaultInputJson }}>
                          <Form.Item name="inputJson" rules={[{ required: true, message: '请输入执行输入 JSON' }]}>
                            <TextArea rows={8} />
                          </Form.Item>
                          <Button type="primary" icon={<PlayCircleOutlined />} loading={executeMutation.isPending} disabled={!draft.id} htmlType="submit">执行 Flow</Button>
                        </Form>
                      </Card>
                      <Card title="输出 / 执行记录" className="flow-panel-card">
                        <Space direction="vertical" className="content-stack" size={10}>
                          {executionResult && (
                            <Alert
                              type={executionResult.status === 'SUCCESS' ? 'success' : 'error'}
                              showIcon
                              message={`最近执行：${executionResult.status}`}
                              description="失败详情来自 outputContext/status，可在运行日志页按 Flow 记录关联查看。"
                            />
                          )}
                          <pre className="flow-json-preview">{shortJson(executionResult?.outputContext || executionResult?.inputContext)}</pre>
                          <div className="flow-execution-list">
                            {(executionsQuery.data || []).slice(0, 5).map((execution) => (
                              <div key={execution.id} className="flow-execution-item">
                                <StatusPill tone={executionTone(execution.status)}>{execution.status}</StatusPill>
                                <span>{execution.id}</span>
                              </div>
                            ))}
                          </div>
                        </Space>
                      </Card>
                    </div>
                  )
                },
                {
                  key: 'json',
                  label: 'JSON 兜底编辑',
                  children: (
                    <Card className="flow-panel-card">
                      {jsonError && <Alert type="error" showIcon message="JSON 解析失败" description={jsonError} className="flow-json-alert" />}
                      <TextArea rows={14} value={jsonDraft} onChange={(event) => setJsonDraft(event.target.value)} onBlur={applyJsonDraft} />
                      <Button style={{ marginTop: 12 }} onClick={applyJsonDraft}>同步 JSON 到画布</Button>
                    </Card>
                  )
                }
              ]}
            />
          </section>
        </section>
      )}
    </Space>
  );
}
