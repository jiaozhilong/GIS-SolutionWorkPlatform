import { emitPreviewWriteNotice } from '../api/runtimeMode';

type JsonRecord = Record<string, unknown>;
type PreviewRecord = JsonRecord & { id: string };

interface PreviewRequest {
  method?: string;
  url?: string;
  data?: unknown;
  params?: JsonRecord;
}

const seededAt = '2026-07-15T09:00:00';

let sequence = 100;
const nextId = (prefix: string) => `${prefix}-preview-${sequence++}`;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function readBody(data: unknown): JsonRecord {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : {};
    } catch {
      return {};
    }
  }
  return typeof data === 'object' && !Array.isArray(data) ? data as JsonRecord : {};
}

function updateRecord(collection: PreviewRecord[], id: string, patch: JsonRecord) {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('本地预览记录不存在');
  collection[index] = { ...collection[index], ...patch, id, updatedAt: new Date().toISOString() };
  emitPreviewWriteNotice();
  return clone(collection[index]);
}

function deleteRecord(collection: PreviewRecord[], id: string) {
  const index = collection.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('本地预览记录不存在');
  collection.splice(index, 1);
  emitPreviewWriteNotice();
  return true;
}

const state = {
  projects: [
    {
      id: 'project-preview-1',
      name: '自然资源时空数据治理方案',
      customerName: '示例市自然资源局',
      industry: '自然资源',
      gisDomain: '时空大数据',
      status: 'ANALYSIS',
      priority: 'P1',
      description: '仅用于本地预览的数据，不会与真实业务数据混合。',
      createdAt: seededAt,
      updatedAt: seededAt
    },
    {
      id: 'project-preview-2',
      name: '智慧园区三维可视化方案',
      customerName: '示例科技园区',
      industry: '智慧园区',
      gisDomain: '三维 GIS',
      status: 'PROPOSAL',
      priority: 'P2',
      description: '本地预览项目。',
      createdAt: seededAt,
      updatedAt: seededAt
    }
  ] as PreviewRecord[],
  skills: [
    {
      id: 'skill-preview-1',
      name: '需求分析',
      type: 'LLM',
      category: 'Solution',
      version: '1.0.0',
      description: '整理客户目标、范围与约束。',
      promptTemplate: '请分析以下 GIS 项目需求：{{input}}',
      inputSchema: '{}',
      outputSchema: '{}',
      requiresIma: 0,
      requiresLlm: 1,
      requiresGithub: 0,
      timeoutSeconds: 60,
      retryCount: 1,
      status: 'ACTIVE',
      createdAt: seededAt,
      updatedAt: seededAt
    },
    {
      id: 'skill-preview-2',
      name: '架构设计',
      type: 'HYBRID',
      category: 'Architecture',
      version: '1.0.0',
      description: '输出 GIS 技术架构建议。',
      promptTemplate: '根据需求输出架构：{{input}}',
      inputSchema: '{}',
      outputSchema: '{}',
      requiresIma: 1,
      requiresLlm: 1,
      requiresGithub: 0,
      timeoutSeconds: 90,
      retryCount: 1,
      status: 'ACTIVE',
      createdAt: seededAt,
      updatedAt: seededAt
    }
  ] as PreviewRecord[],
  flows: [
    {
      id: 'flow-preview-1',
      name: 'GIS Solution Delivery Flow',
      description: '从需求分析到成果交付的本地预览流程。',
      category: 'Solution',
      version: '1.0.0',
      status: 'ACTIVE',
      createdAt: seededAt,
      updatedAt: seededAt,
      nodes: [
        { id: 'node-preview-1', flowId: 'flow-preview-1', clientId: 'n1', skillId: 'skill-preview-1', nodeName: '需求分析', positionX: 210, positionY: 78, timeoutSeconds: 60, retryCount: 1 },
        { id: 'node-preview-2', flowId: 'flow-preview-1', clientId: 'n2', skillId: 'skill-preview-2', nodeName: '架构设计', positionX: 410, positionY: 78, timeoutSeconds: 90, retryCount: 1 }
      ],
      edges: [{ id: 'edge-preview-1', flowId: 'flow-preview-1', sourceNodeId: 'n1', targetNodeId: 'n2' }]
    }
  ] as PreviewRecord[],
  flowExecutions: [] as PreviewRecord[],
  pptRecords: [] as PreviewRecord[],
  templates: [
    { id: 'template-preview-1', name: 'GIS 解决方案标准模板', type: 'PROPOSAL', category: '通用', content: '# 项目概述\n\n{{projectName}}', variablesJson: '["projectName"]', isSystem: 1, createdAt: seededAt, updatedAt: seededAt }
  ] as PreviewRecord[],
  users: [
    { id: 'local-preview-user', username: 'admin', realName: '本地预览', role: 'ADMIN', status: 'ACTIVE', lastLoginAt: seededAt }
  ] as PreviewRecord[],
  imaConfigs: [
    { id: 'ima-preview-1', name: '示例知识库连接', apiKeyMasked: '******preview', kbId: 'kb-preview', kbName: 'GIS 方案知识库', kbType: 'MY', industryTag: 'GIS', isDefault: 1, isActive: 1, createdAt: seededAt, updatedAt: seededAt }
  ] as PreviewRecord[],
  llmConfigs: [
    { id: 'llm-preview-1', name: '示例模型配置', apiBase: 'https://example.invalid/v1', apiKeyMasked: '******preview', modelName: 'preview-model', temperature: 0.4, maxTokens: 4096, timeoutSeconds: 60, usageScene: 'GENERATION', isActive: 1, createdAt: seededAt }
  ] as PreviewRecord[],
  githubConfigs: [
    { id: 'github-preview-1', name: '示例 GitHub 连接', tokenMasked: '******preview', username: 'geoagent-preview', defaultOrg: 'preview-org', isActive: 1, createdAt: seededAt }
  ] as PreviewRecord[],
  logs: [
    { id: 'log-preview-1', module: 'AUTH', action: 'PREVIEW_LOGIN', logType: 'SKILL', level: 'INFO', message: '已进入本地预览模式', detail: '{"mode":"PREVIEW"}', durationMs: 12, createdAt: seededAt },
    { id: 'log-preview-2', module: 'FLOW', action: 'PREVIEW_READY', logType: 'FLOW', level: 'INFO', message: '预览流程数据已就绪', detail: '{}', durationMs: 24, createdAt: seededAt }
  ] as PreviewRecord[]
};

function createFlow(payload: JsonRecord) {
  const id = nextId('flow');
  const rawNodes = Array.isArray(payload.nodes) ? payload.nodes as JsonRecord[] : [];
  const rawEdges = Array.isArray(payload.edges) ? payload.edges as JsonRecord[] : [];
  const record: PreviewRecord = {
    ...payload,
    id,
    nodes: rawNodes.map((node) => ({ ...node, id: nextId('node'), flowId: id })),
    edges: rawEdges.map((edge) => ({ ...edge, id: nextId('edge'), flowId: id })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.flows.unshift(record);
  emitPreviewWriteNotice();
  return clone(record);
}

function createPpt(projectId: string, title?: unknown) {
  const project = state.projects.find((item) => item.id === projectId);
  const record: PreviewRecord = {
    id: nextId('ppt'),
    projectId,
    title: typeof title === 'string' && title ? title : `${String(project?.name || 'GIS 项目')} 解决方案汇报`,
    outlineJson: JSON.stringify([{ page: 1, title: '项目概述', keyPoint: '目标与范围' }]),
    contentJson: JSON.stringify({ version: '1.0', projectId, slides: [{ type: 'cover', title: String(project?.name || 'GIS 解决方案'), bullets: ['从客户需求到方案交付'] }] }),
    status: 'EDITING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.pptRecords.unshift(record);
  emitPreviewWriteNotice();
  return clone(record);
}

function listLogs(params: JsonRecord) {
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const keyword = String(params.keyword || '').toLowerCase();
  const filtered = state.logs.filter((item) => {
    const matchesKeyword = !keyword || [item.message, item.module, item.action].some((value) => String(value || '').toLowerCase().includes(keyword));
    return matchesKeyword
      && (!params.logType || item.logType === params.logType)
      && (!params.level || item.level === params.level)
      && (!params.module || item.module === params.module)
      && (!params.action || item.action === params.action);
  });
  const records = filtered.slice((page - 1) * pageSize, page * pageSize);
  return {
    total: filtered.length,
    page,
    pageSize,
    records: clone(records),
    logTypeStats: filtered.reduce<Record<string, number>>((stats, item) => ({ ...stats, [String(item.logType || 'UNKNOWN')]: (stats[String(item.logType || 'UNKNOWN')] || 0) + 1 }), {}),
    levelStats: filtered.reduce<Record<string, number>>((stats, item) => ({ ...stats, [String(item.level || 'INFO')]: (stats[String(item.level || 'INFO')] || 0) + 1 }), {}),
    avgDurationMs: filtered.length ? Math.round(filtered.reduce((sum, item) => sum + Number(item.durationMs || 0), 0) / filtered.length) : 0
  };
}

function filterRecords(collection: PreviewRecord[], params: JsonRecord, keys: string[]) {
  const keyword = String(params.keyword || '').toLowerCase();
  return clone(collection.filter((item) => {
    const matchesKeyword = !keyword || Object.values(item).some((value) => String(value || '').toLowerCase().includes(keyword));
    return matchesKeyword && keys.every((key) => !params[key] || item[key] === params[key]);
  }));
}

export const previewRepository = {
  request<T>({ method = 'get', url = '/', data, params = {} }: PreviewRequest): T {
    const verb = method.toLowerCase();
    const path = (url.split('?')[0] || '/').replace(/^\/api/, '');
    const body = readBody(data);

    if (verb === 'get' && path === '/hello') return '本地预览已就绪' as T;
    if (verb === 'get' && path === '/auth/me') return clone(state.users[0]) as T;
    if (verb === 'post' && path === '/auth/change-password') return true as T;

    if (path === '/projects' && verb === 'get') return clone(state.projects) as T;
    if (path === '/projects' && verb === 'post') {
      const record = { ...body, id: nextId('project'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as PreviewRecord;
      state.projects.unshift(record);
      emitPreviewWriteNotice();
      return clone(record) as T;
    }
    const projectItem = path.match(/^\/projects\/([^/]+)$/);
    if (projectItem && verb === 'put') return updateRecord(state.projects, projectItem[1], body) as T;
    if (projectItem && verb === 'delete') return deleteRecord(state.projects, projectItem[1]) as T;
    const projectRun = path.match(/^\/projects\/([^/]+)\/flows\/([^/]+)\/run$/);
    if (projectRun && verb === 'post') {
      const execution = { id: nextId('execution'), projectId: projectRun[1], flowId: projectRun[2], flowVersion: '1.0.0', triggerType: 'MANUAL', inputContext: JSON.stringify(body.inputContext || {}), outputContext: JSON.stringify({ message: '本地预览执行完成' }), status: 'SUCCESS', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), createdAt: new Date().toISOString() } as PreviewRecord;
      state.flowExecutions.unshift(execution);
      emitPreviewWriteNotice();
      return clone(execution) as T;
    }
    const projectExecutions = path.match(/^\/projects\/([^/]+)\/flow-executions$/);
    if (projectExecutions && verb === 'get') return clone(state.flowExecutions.filter((item) => item.projectId === projectExecutions[1])) as T;
    const projectPptGenerate = path.match(/^\/projects\/([^/]+)\/ppt\/outline\/generate$/);
    if (projectPptGenerate && verb === 'post') return createPpt(projectPptGenerate[1], body.title) as T;
    const projectPptList = path.match(/^\/projects\/([^/]+)\/ppt$/);
    if (projectPptList && verb === 'get') return clone(state.pptRecords.filter((item) => item.projectId === projectPptList[1])) as T;

    if (path === '/flows' && verb === 'get') return clone(state.flows) as T;
    if (path === '/flows' && verb === 'post') return createFlow(body) as T;
    const flowItem = path.match(/^\/flows\/([^/]+)$/);
    if (flowItem && verb === 'put') {
      const patched = { ...body };
      if (Array.isArray(body.nodes)) patched.nodes = (body.nodes as JsonRecord[]).map((node) => ({ ...node, id: String(node.id || nextId('node')), flowId: flowItem[1] }));
      if (Array.isArray(body.edges)) patched.edges = (body.edges as JsonRecord[]).map((edge) => ({ ...edge, id: String(edge.id || nextId('edge')), flowId: flowItem[1] }));
      return updateRecord(state.flows, flowItem[1], patched) as T;
    }
    if (flowItem && verb === 'delete') return deleteRecord(state.flows, flowItem[1]) as T;
    const flowExecute = path.match(/^\/flows\/([^/]+)\/execute$/);
    if (flowExecute && verb === 'post') {
      const execution = { id: nextId('execution'), flowId: flowExecute[1], flowVersion: '1.0.0', triggerType: 'MANUAL', inputContext: JSON.stringify(body.inputContext || {}), outputContext: JSON.stringify({ message: '本地预览执行完成' }), status: 'SUCCESS', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), createdAt: new Date().toISOString() } as PreviewRecord;
      state.flowExecutions.unshift(execution);
      emitPreviewWriteNotice();
      return clone(execution) as T;
    }
    const flowExecutions = path.match(/^\/flows\/([^/]+)\/executions$/);
    if (flowExecutions && verb === 'get') return clone(state.flowExecutions.filter((item) => item.flowId === flowExecutions[1])) as T;

    if (path === '/skills' && verb === 'get') return clone(state.skills) as T;
    if (path === '/skills' && verb === 'post') {
      const record = { ...body, id: nextId('skill'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as PreviewRecord;
      state.skills.unshift(record);
      emitPreviewWriteNotice();
      return clone(record) as T;
    }
    const skillItem = path.match(/^\/skills\/([^/]+)$/);
    if (skillItem && verb === 'put') return updateRecord(state.skills, skillItem[1], body) as T;
    if (skillItem && verb === 'delete') return deleteRecord(state.skills, skillItem[1]) as T;
    const skillTest = path.match(/^\/skills\/([^/]+)\/test$/);
    if (skillTest && verb === 'post') {
      const skill = state.skills.find((item) => item.id === skillTest[1]);
      return { skillId: skillTest[1], skillName: String(skill?.name || 'Preview Skill'), renderedPrompt: `本地预览：${JSON.stringify(body.input || {})}`, llmResponse: '本地预览测试完成', status: 'SUCCESS', durationMs: 18 } as T;
    }

    if (path === '/system/logs' && verb === 'get') return listLogs(params) as T;

    if (path === '/templates' && verb === 'get') return filterRecords(state.templates, params, ['type', 'category']) as T;
    if (path === '/templates' && verb === 'post') {
      const record = { ...body, id: nextId('template'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as PreviewRecord;
      state.templates.unshift(record);
      emitPreviewWriteNotice();
      return clone(record) as T;
    }
    const templateItem = path.match(/^\/templates\/([^/]+)$/);
    if (templateItem && verb === 'put') return updateRecord(state.templates, templateItem[1], body) as T;
    if (templateItem && verb === 'delete') return deleteRecord(state.templates, templateItem[1]) as T;

    if (path === '/users' && verb === 'get') return filterRecords(state.users, params, ['role', 'status']) as T;
    if (path === '/users' && verb === 'post') {
      const { password: _password, ...safeBody } = body;
      const record = { ...safeBody, id: nextId('user'), lastLoginAt: undefined } as PreviewRecord;
      state.users.unshift(record);
      emitPreviewWriteNotice();
      return clone(record) as T;
    }
    const userItem = path.match(/^\/users\/([^/]+)$/);
    if (userItem && verb === 'put') return updateRecord(state.users, userItem[1], body) as T;
    if (userItem && verb === 'delete') return deleteRecord(state.users, userItem[1]) as T;
    if (/^\/users\/[^/]+\/reset-password$/.test(path) && verb === 'post') {
      emitPreviewWriteNotice();
      return true as T;
    }

    const configCollections: Array<{ base: string; collection: PreviewRecord[]; prefix: string; secret: string }> = [
      { base: '/ima/config', collection: state.imaConfigs, prefix: 'ima', secret: 'apiKey' },
      { base: '/llm/config', collection: state.llmConfigs, prefix: 'llm', secret: 'apiKey' },
      { base: '/github/config', collection: state.githubConfigs, prefix: 'github', secret: 'token' }
    ];
    for (const config of configCollections) {
      if (path === config.base && verb === 'get') return clone(config.collection) as T;
      if (path === config.base && verb === 'post') {
        const { [config.secret]: _secret, ...safeBody } = body;
        const record = { ...safeBody, id: nextId(config.prefix), [`${config.secret}Masked`]: '******preview', createdAt: new Date().toISOString() } as PreviewRecord;
        config.collection.unshift(record);
        emitPreviewWriteNotice();
        return clone(record) as T;
      }
      const itemMatch = path.match(new RegExp(`^${config.base.replace('/', '\\/')}\\/([^/]+)$`));
      if (itemMatch && verb === 'put') {
        const { [config.secret]: _secret, ...safeBody } = body;
        return updateRecord(config.collection, itemMatch[1], safeBody) as T;
      }
      if (itemMatch && verb === 'delete') return deleteRecord(config.collection, itemMatch[1]) as T;
      if (path.match(new RegExp(`^${config.base.replace('/', '\\/')}\\/[^/]+\\/test$`)) && verb === 'post') {
        if (config.prefix === 'ima') return true as T;
        return { connected: true, latencyMs: 16, message: '本地预览连接正常', responsePreview: config.prefix === 'llm' ? 'Preview response' : undefined, login: config.prefix === 'github' ? 'geoagent-preview' : undefined, rateLimitRemaining: config.prefix === 'github' ? 5000 : undefined } as T;
      }
    }

    if (path === '/ima/search' && verb === 'post') {
      const query = String(body.query || '');
      return { query, totalFound: query ? 1 : 0, items: query ? [{ id: 'ima-item-preview-1', title: 'GIS 方案知识条目（本地预览）', type: 'DOCUMENT', score: 0.92, kbId: 'kb-preview', kbName: 'GIS 方案知识库' }] : [] } as T;
    }

    if (path === '/ppt/generate' && verb === 'post') return createPpt(String(body.projectId || 'project-preview-1'), body.title) as T;
    if (path === '/ppt/records' && verb === 'get') return clone(params.projectId ? state.pptRecords.filter((item) => item.projectId === params.projectId) : state.pptRecords) as T;
    const pptItem = path.match(/^\/ppt\/records\/([^/]+)$/);
    if (pptItem && verb === 'get') {
      const record = state.pptRecords.find((item) => item.id === pptItem[1]);
      if (!record) throw new Error('本地预览 PPT 记录不存在');
      return clone(record) as T;
    }
    if (pptItem && verb === 'put') return updateRecord(state.pptRecords, pptItem[1], body) as T;

    if (/^\/github\/repos\/[^/]+\/[^/]+\/readme$/.test(path) && verb === 'get') return '# GeoAgent Preview\n\n这是本地预览 README，不会访问 GitHub。' as T;
    if (/^\/github\/repos\/[^/]+\/[^/]+\/tree$/.test(path) && verb === 'get') return [{ path: 'README.md', type: 'blob', size: 96, sha: 'preview-sha' }] as T;
    const githubFile = path.match(/^\/github\/repos\/([^/]+)\/([^/]+)\/file$/);
    if (githubFile && verb === 'get') return { owner: githubFile[1], repo: githubFile[2], path: String(params.path || 'README.md'), name: String(params.path || 'README.md').split('/').pop() || 'README.md', sha: 'preview-sha', encoding: 'utf-8', content: '# 本地预览文件\n\n未访问真实 GitHub。' } as T;

    throw new Error(`本地预览暂未支持：${verb.toUpperCase()} ${path}`);
  }
};
