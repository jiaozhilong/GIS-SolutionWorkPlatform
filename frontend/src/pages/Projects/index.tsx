import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuProps } from 'antd';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Result,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { listFlows, type FlowExecution } from '../../api/flows';
import {
  createProject,
  deleteProject,
  generateProjectPptOutline,
  listProjects,
  listProjectFlowExecutions,
  listProjectPptRecords,
  runProjectFlow,
  type Project,
  type ProjectPayload,
  type PptRecord,
  updateProject
} from '../../api/projects';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';
import { useAuthStore } from '../../stores/authStore';

const { TextArea } = Input;
const ProjectArchitecturePreview = lazy(() => import('../../components/ProjectArchitecturePreview'));
const PptDeliveryEditor = lazy(() => import('../../components/PptDeliveryEditor'));

const statusOptions = [
  { label: '商机', value: 'OPPORTUNITY' },
  { label: '需求分析', value: 'ANALYSIS' },
  { label: '方案设计', value: 'PROPOSAL' },
  { label: '投标', value: 'BIDDING' },
  { label: '已签约', value: 'SIGNED' },
  { label: '交付中', value: 'DELIVERY' },
  { label: '已关闭', value: 'CLOSED' }
];

const priorityOptions = ['P0', 'P1', 'P2', 'P3'].map((value) => ({ label: value, value }));
const activeStatuses = new Set(['OPPORTUNITY', 'ANALYSIS', 'PROPOSAL', 'BIDDING', 'DELIVERY']);
const payloadKeys: Array<keyof ProjectPayload> = [
  'name',
  'customerName',
  'industry',
  'gisDomain',
  'status',
  'priority',
  'description',
  'githubRepoUrl'
];

interface ProjectFilter {
  keyword?: string;
  industry?: string;
  status?: string;
  priority?: string;
}

function sanitizeProjectPayload(values: ProjectPayload): ProjectPayload {
  return payloadKeys.reduce<ProjectPayload>((payload, key) => {
    const value = values[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) payload[key] = trimmed as never;
      return payload;
    }
    if (value !== undefined && value !== null) payload[key] = value as never;
    return payload;
  }, {} as ProjectPayload);
}

function getStatusLabel(value?: string) {
  return statusOptions.find((item) => item.value === value)?.label || value || '商机';
}

function getStatusTone(value?: string): 'green' | 'cyan' | 'amber' | 'muted' {
  if (value === 'SIGNED' || value === 'DELIVERY') return 'green';
  if (value === 'CLOSED') return 'muted';
  if (value === 'BIDDING') return 'amber';
  return 'cyan';
}

function getPriorityColor(value?: string) {
  if (value === 'P0') return 'red';
  if (value === 'P1') return 'orange';
  if (value === 'P2') return 'cyan';
  return 'default';
}

function projectProgress(project?: Project | null) {
  const mapping: Record<string, number> = {
    OPPORTUNITY: 16,
    ANALYSIS: 34,
    PROPOSAL: 56,
    BIDDING: 72,
    DELIVERY: 86,
    SIGNED: 100,
    CLOSED: 100
  };
  return mapping[project?.status || 'OPPORTUNITY'] || 20;
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function getExecutionTone(status?: string): 'green' | 'cyan' | 'amber' | 'red' | 'muted' {
  if (status === 'SUCCESS' || status === 'COMPLETED') return 'green';
  if (status === 'RUNNING') return 'cyan';
  if (status === 'FAILED' || status === 'ERROR') return 'red';
  if (status === 'PENDING') return 'amber';
  return 'muted';
}

function getExecutionLabel(status?: string) {
  const labels: Record<string, string> = {
    SUCCESS: '已完成',
    COMPLETED: '已完成',
    RUNNING: '运行中',
    FAILED: '失败',
    ERROR: '异常',
    PENDING: '等待中'
  };
  return labels[status || ''] || status || '暂无记录';
}

function getLatestExecution(executions: FlowExecution[]) {
  return [...executions].sort((a, b) => {
    const left = new Date(a.createdAt || a.startedAt || 0).getTime();
    const right = new Date(b.createdAt || b.startedAt || 0).getTime();
    return right - left;
  })[0];
}

function getPptTitle(project?: Project | null) {
  return project?.name ? `${project.name} 解决方案汇报` : 'GIS 解决方案汇报';
}

export default function ProjectManagerPage() {
  const [form] = Form.useForm<ProjectPayload>();
  const [filterForm] = Form.useForm<ProjectFilter>();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [filters, setFilters] = useState<ProjectFilter>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [selectedFlowId, setSelectedFlowId] = useState<string>();
  const [flowInput, setFlowInput] = useState('');
  const [pptDirty, setPptDirty] = useState(false);
  const currentUserName = useAuthStore((state) => state.realName || state.username || '-');
  const selectedProjectId = selected?.id;

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const projects = projectsQuery.data || [];
  const flowsQuery = useQuery({ queryKey: ['flows', 'project-detail'], queryFn: listFlows, enabled: !!selectedProjectId });
  const executionsQuery = useQuery({
    queryKey: ['project-flow-executions', selectedProjectId],
    queryFn: () => listProjectFlowExecutions(selectedProjectId!),
    enabled: !!selectedProjectId
  });
  const pptRecordsQuery = useQuery({
    queryKey: ['project-ppt-records', selectedProjectId],
    queryFn: () => listProjectPptRecords(selectedProjectId!),
    enabled: !!selectedProjectId
  });
  const flows = flowsQuery.data || [];
  const flowExecutions = executionsQuery.data || [];
  const pptRecords = pptRecordsQuery.data || [];

  const industries = useMemo(() => (
    Array.from(new Set(projects.map((item) => item.industry).filter(Boolean)))
      .map((value) => ({ label: value as string, value: value as string }))
  ), [projects]);

  useEffect(() => {
    const state = (location.state || {}) as { openCreate?: boolean; openProjectId?: string };
    const params = new URLSearchParams(location.search);

    if (state.openCreate || params.get('create') === '1') {
      setEditing(null);
      form.resetFields();
      form.setFieldsValue({ status: 'OPPORTUNITY', priority: 'P2' });
      setModalOpen(true);
      return;
    }

    if (state.openProjectId && projects.length > 0) {
      const matched = projects.find((project) => project.id === state.openProjectId);
      if (matched) setSelected(matched);
    }
  }, [form, location.search, location.state, projects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setActiveDetailTab('overview');
      setSelectedFlowId(undefined);
      setFlowInput('');
      setPptDirty(false);
      return;
    }
    if (!selectedFlowId && flows[0]?.id) {
      setSelectedFlowId(flows[0].id);
    }
  }, [flows, selectedFlowId, selectedProjectId]);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const keyword = filters.keyword?.toLowerCase();
    const keywordMatched = !keyword || [
      project.name,
      project.customerName,
      project.industry,
      project.gisDomain
    ].some((value) => value?.toLowerCase().includes(keyword));

    return keywordMatched
      && (!filters.industry || project.industry === filters.industry)
      && (!filters.status || project.status === filters.status)
      && (!filters.priority || project.priority === filters.priority);
  }), [filters, projects]);

  const stats = useMemo(() => {
    const active = projects.filter((item) => activeStatuses.has(item.status || 'OPPORTUNITY')).length;
    const delivered = projects.filter((item) => ['SIGNED', 'DELIVERY'].includes(item.status || '')).length;
    const highPriority = projects.filter((item) => item.priority === 'P0' || item.priority === 'P1').length;

    return [
      { label: '项目总数', value: projects.length, helper: '全部 GIS 交付项目', tone: 'cyan' as const },
      { label: '进行中', value: active, helper: '需持续推进', tone: 'green' as const, progress: projects.length ? Math.round((active / projects.length) * 100) : 0 },
      { label: '签约/交付', value: delivered, helper: '进入成果阶段', tone: 'blue' as const },
      { label: '高优先级', value: highPriority, helper: 'P0 / P1 重点跟进', tone: 'amber' as const }
    ];
  }, [projects]);

  const saveMutation = useMutation({
    mutationFn: (values: ProjectPayload) => {
      const payload = sanitizeProjectPayload(values);
      return editing ? updateProject(editing.id, payload) : createProject(payload);
    },
    onSuccess: () => {
      message.success(editing ? '项目已更新' : '项目已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, projectId) => {
      message.success('项目已删除');
      if (selected?.id === projectId) setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const runFlowMutation = useMutation({
    mutationFn: () => {
      if (!selectedProjectId || !selected) throw new Error('请先选择项目');
      const flowId = selectedFlowId || flows[0]?.id;
      if (!flowId) throw new Error('暂无可运行的 Flow，请先到流程编排页创建流程');
      return runProjectFlow(selectedProjectId, flowId, {
        projectId: selectedProjectId,
        projectName: selected.name,
        customerName: selected.customerName || '',
        industry: selected.industry || '',
        gisDomain: selected.gisDomain || '',
        requirement: selected.description || '',
        operatorInput: flowInput.trim() || '请基于当前项目信息生成 GIS 解决方案建议。'
      });
    },
    onSuccess: () => {
      message.success('方案生成 Flow 已启动');
      queryClient.invalidateQueries({ queryKey: ['project-flow-executions', selectedProjectId] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const generatePptMutation = useMutation({
    mutationFn: () => {
      if (!selectedProjectId) throw new Error('请先选择项目');
      return generateProjectPptOutline(selectedProjectId, getPptTitle(selected));
    },
    onSuccess: () => {
      message.success('PPT 大纲生成任务已提交');
      queryClient.invalidateQueries({ queryKey: ['project-ppt-records', selectedProjectId] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'OPPORTUNITY', priority: 'P2' });
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    form.setFieldsValue({
      name: project.name,
      customerName: project.customerName,
      industry: project.industry,
      gisDomain: project.gisDomain,
      status: project.status || 'OPPORTUNITY',
      priority: project.priority || 'P2',
      description: project.description,
      githubRepoUrl: project.githubRepoUrl
    });
    setModalOpen(true);
  };

  const submitFilters = (values: ProjectFilter) => {
    setFilters({
      keyword: values.keyword?.trim() || undefined,
      industry: values.industry,
      status: values.status,
      priority: values.priority
    });
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const actionMenu = (record: Project): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: '编辑', onClick: () => openEdit(record) },
    {
      key: 'delete',
      danger: true,
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm
          title="确认删除这个项目？"
          description="删除后不会从当前页立即移除，直到后端确认成功。"
          onConfirm={() => deleteMutation.mutate(record.id)}
        >
          <span>删除</span>
        </Popconfirm>
      )
    }
  ];

  const closeDetail = () => {
    if (pptDirty && !window.confirm('PPT 编辑器有未保存修改，关闭项目详情会丢失这些修改，是否继续？')) return;
    setSelected(null);
  };
  const changeDetailTab = (key: string) => {
    if (activeDetailTab === 'deliverables' && key !== 'deliverables' && pptDirty && !window.confirm('PPT 编辑器有未保存修改，切换页面会丢失这些修改，是否继续？')) return;
    setActiveDetailTab(key);
  };
  const selectedFlow = flows.find((flow) => flow.id === selectedFlowId) || flows[0];
  const latestExecution = getLatestExecution(flowExecutions);
  const flowOptions = flows.map((flow) => ({ label: `${flow.name}${flow.version ? ` · ${flow.version}` : ''}`, value: flow.id }));

  const renderArchitecturePreview = () => (
    <Suspense fallback={<Skeleton.Button active block className="project-architecture-loading" />}>
      <ProjectArchitecturePreview />
    </Suspense>
  );

  const renderDeliverables = (records: PptRecord[]) => (
    <div className="project-deliverable-grid">
      <button className="project-deliverable-card" type="button" onClick={() => message.info('方案文档将由成果交付模块统一生成')}>
        <FileWordOutlined />
        <strong>方案文档</strong>
        <span>{selected?.name || '当前项目'} 解决方案.docx</span>
        <small>预览 / 下载 / 更多</small>
      </button>
      <button className="project-deliverable-card" type="button" onClick={() => message.info('技术架构 PDF 将由成果交付模块统一生成')}>
        <FilePdfOutlined />
        <strong>技术架构</strong>
        <span>{selected?.gisDomain || 'GIS'} 技术架构说明.pdf</span>
        <small>预览 / 下载 / 更多</small>
      </button>
      <button className="project-deliverable-card" type="button" onClick={() => generatePptMutation.mutate()}>
        <FilePptOutlined />
        <strong>汇报 PPT</strong>
        <span>{records[0]?.title || getPptTitle(selected)}</span>
        <small>{records.length ? `已有 ${records.length} 份记录` : '点击生成 PPT 大纲'}</small>
      </button>
      <button className="project-deliverable-card is-add" type="button" onClick={() => message.info('新增交付物上传将在文档与附件模块接入')}>
        <FileAddOutlined />
        <strong>新增交付物</strong>
        <span>Word / PDF / PPT / 图纸附件</span>
        <small>设计态入口，等待上传接口</small>
      </button>
    </div>
  );

  const renderDesignedEmpty = (title: string, description: string) => (
    <Card className="project-empty-state">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={title}>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </Empty>
    </Card>
  );

  const detailTabs = selected ? [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <Space direction="vertical" size={16} className="content-stack">
          <div className="project-detail-overview-grid">
            <Card className="project-detail-card" title="需求摘要">
              {selected.description ? (
                <Typography.Paragraph className="project-requirement-text">{selected.description}</Typography.Paragraph>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无需求摘要">
                  <Button type="primary" onClick={() => openEdit(selected)}>补充项目描述</Button>
                </Empty>
              )}
              <div className="project-tag-row">
                <Tag color="green">{selected.industry || '行业未填写'}</Tag>
                <Tag color="cyan">{selected.gisDomain || 'GIS 领域未填写'}</Tag>
                <Tag color={getPriorityColor(selected.priority)}>{selected.priority || 'P2'}</Tag>
              </div>
            </Card>

            <Card className="project-detail-card" title="AI 流程进展">
              <div className="project-flow-panel">
                <div className="project-flow-stage is-done"><CheckCircleOutlined /><span>需求分析</span></div>
                <div className="project-flow-stage is-done"><CheckCircleOutlined /><span>产品匹配</span></div>
                <div className="project-flow-stage is-active"><NodeIndexOutlined /><span>架构设计</span></div>
                <div className="project-flow-stage"><FileTextOutlined /><span>方案撰写</span></div>
                <div className="project-flow-stage"><FilePptOutlined /><span>PPT 生成</span></div>
              </div>
              <Progress percent={projectProgress(selected)} strokeColor="#167D64" />
              <Alert
                type={latestExecution ? (latestExecution.status === 'FAILED' ? 'error' : 'success') : 'info'}
                showIcon
                className="project-detail-alert"
                message={latestExecution ? `最近执行：${getExecutionLabel(latestExecution.status)}` : '暂无 Flow 执行记录'}
                description={latestExecution ? `执行 ID：${latestExecution.id}` : '选择 Flow 后可从当前项目启动方案生成。'}
              />
            </Card>

            <div className="project-detail-preview-column">
              {renderArchitecturePreview()}
            </div>

            <div className="project-detail-side-stack">
              <Card className="project-detail-card" title="项目信息">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="项目编号">—</Descriptions.Item>
                  <Descriptions.Item label="负责人">{currentUserName}</Descriptions.Item>
                  <Descriptions.Item label="预计交付">—</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{formatDate(selected.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{formatDate(selected.updatedAt)}</Descriptions.Item>
                  <Descriptions.Item label="GitHub">{selected.githubRepoUrl || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
              <Card className="project-detail-card" title="下一步行动">
                <Space direction="vertical" className="content-stack">
                  <Button block type="primary" icon={<PlayCircleOutlined />} loading={runFlowMutation.isPending} onClick={() => runFlowMutation.mutate()}>
                    启动方案生成
                  </Button>
                  <Button block icon={<FilePptOutlined />} loading={generatePptMutation.isPending} onClick={() => generatePptMutation.mutate()}>
                    生成 PPT 大纲
                  </Button>
                  <Button block onClick={() => setActiveDetailTab('requirements')}>完善需求管理</Button>
                </Space>
              </Card>
            </div>
          </div>

          <Card title="生成的交付物" className="project-detail-card">
            {renderDeliverables(pptRecords)}
          </Card>
        </Space>
      )
    },
    {
      key: 'requirements',
      label: '需求管理',
      children: selected.description
        ? <Card className="project-detail-card"><Typography.Paragraph>{selected.description}</Typography.Paragraph><Button onClick={() => openEdit(selected)}>编辑需求摘要</Button></Card>
        : renderDesignedEmpty('暂无需求内容', '请在项目编辑中补充客户背景、原始需求、现有系统和交付约束。')
    },
    {
      key: 'ai-flow',
      label: 'AI 流程',
      children: (
        <div className="project-ai-flow-grid">
          <Card title="执行设置" className="project-detail-card">
            <Space direction="vertical" className="content-stack">
              <Select
                placeholder="选择 Flow"
                options={flowOptions}
                value={selectedFlow?.id}
                loading={flowsQuery.isLoading}
                onChange={setSelectedFlowId}
              />
              <TextArea
                rows={5}
                value={flowInput}
                onChange={(event) => setFlowInput(event.target.value)}
                placeholder="补充本次 Flow 的输入上下文，例如重点行业、交付边界、客户偏好。"
              />
              {flowsQuery.isError && <Alert type="error" showIcon message="Flow 列表加载失败" description={(flowsQuery.error as Error).message} />}
              <Button type="primary" icon={<PlayCircleOutlined />} loading={runFlowMutation.isPending} onClick={() => runFlowMutation.mutate()}>
                使用当前项目启动 Flow
              </Button>
            </Space>
          </Card>
          <Card title="执行记录" className="project-detail-card">
            {executionsQuery.isLoading && <Skeleton active paragraph={{ rows: 4 }} />}
            {executionsQuery.isError && <Alert type="error" showIcon message="执行记录加载失败" description={(executionsQuery.error as Error).message} />}
            {!executionsQuery.isLoading && !executionsQuery.isError && flowExecutions.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无执行记录" />
            )}
            <Space direction="vertical" className="content-stack">
              {flowExecutions.map((execution) => (
                <div className="project-execution-row" key={execution.id}>
                  <StatusPill tone={getExecutionTone(execution.status)}>{getExecutionLabel(execution.status)}</StatusPill>
                  <strong>{execution.flowVersion || execution.flowId}</strong>
                  <span>{formatDate(execution.createdAt || execution.startedAt)}</span>
                </div>
              ))}
            </Space>
          </Card>
        </div>
      )
    },
    {
      key: 'deliverables',
      label: '成果交付',
      children: (
        <Space direction="vertical" size={16} className="content-stack">
          {pptRecordsQuery.isError && <Alert type="error" showIcon message="PPT 记录加载失败" description={(pptRecordsQuery.error as Error).message} />}
          {pptRecordsQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
              <PptDeliveryEditor
                project={selected}
                records={pptRecords}
                latestExecutionId={latestExecution?.status === 'SUCCESS' ? latestExecution.id : undefined}
                onDirtyChange={setPptDirty}
              />
            </Suspense>
          )}
        </Space>
      )
    },
    { key: 'docs', label: '文档与附件', children: renderDesignedEmpty('文档与附件待接入', '当前页面先保留设计完成的空状态，后续接入上传、预览和下载接口。') },
    { key: 'tasks', label: '任务与计划', children: renderDesignedEmpty('任务计划待接入', '负责人、预计交付日和任务流目前后端未提供，页面不会提交这些字段。') },
    { key: 'communication', label: '沟通记录', children: renderDesignedEmpty('沟通记录待接入', '后续可接入会议纪要、客户反馈和方案评审记录。') }
  ] : [];

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page project-war-room">
      <PageHeader
        eyebrow="PROJECT WAR ROOM"
        title="项目作战室"
        description="以表格统一管理客户需求、GIS 领域、阶段进度和交付优先级。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => projectsQuery.refetch()}>{'刷新'}</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>{'新建项目'}</Button>
        ]}
      />

      <StatGrid items={stats} />

      <Card className="toolbar-card project-filter-card">
        <Form form={filterForm} layout="inline" onFinish={submitFilters} className="project-filter-form">
          <Form.Item name="keyword" className="project-filter-keyword">
            <Input allowClear placeholder="搜索项目、客户、行业、GIS 领域" />
          </Form.Item>
          <Form.Item name="industry">
            <Select allowClear placeholder="行业" options={industries} />
          </Form.Item>
          <Form.Item name="status">
            <Select allowClear placeholder="阶段" options={statusOptions} />
          </Form.Item>
          <Form.Item name="priority">
            <Select allowClear placeholder="优先级" options={priorityOptions} />
          </Form.Item>
          <Form.Item className="project-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit">{'筛选'}</Button>
              <Button onClick={resetFilters}>{'重置'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {projectsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {projectsQuery.isError && (
        <Result
          status="error"
          title="项目列表加载失败"
          subTitle={(projectsQuery.error as Error).message}
          extra={<Button onClick={() => projectsQuery.refetch()}>{'重试'}</Button>}
        />
      )}
      {projectsQuery.isSuccess && filteredProjects.length === 0 && (
        <Card>
          <Empty description="暂无符合条件的 GIS 项目">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{'创建第一个项目'}</Button>
          </Empty>
        </Card>
      )}
      {projectsQuery.isSuccess && filteredProjects.length > 0 && (
        <Card className="gis-table-card project-table-card">
          <Table<Project>
            rowKey="id"
            dataSource={filteredProjects}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            scroll={{ x: 1260 }}
            columns={[
              {
                title: '项目名称',
                dataIndex: 'name',
                fixed: 'left',
                width: 260,
                render: (name: string, record) => <Button type="link" className="gis-link-button" onClick={() => setSelected(record)}>{name}</Button>
              },
              { title: '客户', dataIndex: 'customerName', width: 180, render: (value?: string) => value || '-' },
              { title: '行业', dataIndex: 'industry', width: 140, render: (value?: string) => value || '-' },
              { title: 'GIS 领域', dataIndex: 'gisDomain', width: 170, render: (value?: string) => value || '-' },
              { title: '阶段', dataIndex: 'status', width: 130, render: (value?: string) => <StatusPill tone={getStatusTone(value)}>{getStatusLabel(value)}</StatusPill> },
              { title: '进度', width: 160, render: (_, record) => <Progress percent={projectProgress(record)} size="small" showInfo={false} strokeColor="#167D64" /> },
              { title: '优先级', dataIndex: 'priority', width: 110, render: (value?: string) => <Tag color={getPriorityColor(value)}>{value || 'P2'}</Tag> },
              { title: '更新时间', dataIndex: 'updatedAt', width: 170, render: formatDate },
              {
                title: '操作',
                fixed: 'right',
                width: 150,
                render: (_, record) => (
                  <Space size={8}>
                    <Button icon={<EyeOutlined />} onClick={() => setSelected(record)}>{'查看'}</Button>
                    <Dropdown menu={{ items: actionMenu(record) }} trigger={['click']}>
                      <Button loading={deleteMutation.isPending}>{'更多'} <DownOutlined /></Button>
                    </Dropdown>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}

      <Modal
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="例如：智慧园区三维可视化平台建设方案" />
          </Form.Item>
          <Form.Item name="customerName" label="客户名称"><Input placeholder="例如：某市自然资源局" /></Form.Item>
          <Form.Item name="industry" label="行业"><Input placeholder="自然资源 / 智慧城市 / 园区 / 水利环保" /></Form.Item>
          <Form.Item name="gisDomain" label="GIS 领域"><Input placeholder="时空大数据 / CIM / 遥感监测 / 三维可视化" /></Form.Item>
          <Space size={16} className="form-row">
            <Form.Item name="status" label="阶段" className="form-item-half"><Select options={statusOptions} /></Form.Item>
            <Form.Item name="priority" label="优先级" className="form-item-half"><Select options={priorityOptions} /></Form.Item>
          </Space>
          <Form.Item name="githubRepoUrl" label="GitHub 仓库"><Input placeholder="https://github.com/owner/repo" /></Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={4} placeholder="补充客户背景、原始需求、已有系统、交付边界和关键约束" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        className="project-detail-drawer"
        width="calc(100vw - 32px)"
        open={!!selected}
        onClose={closeDetail}
        closable={false}
        destroyOnClose={false}
      >
        {selected && (
          <section className="project-detail-shell">
            <header className="project-detail-header">
              <Button icon={<ArrowLeftOutlined />} onClick={closeDetail}>返回</Button>
              <div className="project-detail-header__main">
                <Typography.Text className="gis-section-kicker">PROJECT DELIVERY WORKSPACE</Typography.Text>
                <Typography.Title level={3}>{selected.name}</Typography.Title>
                <div className="project-detail-header__meta">
                  <span>{selected.customerName || '未填写客户'}</span>
                  <StatusPill tone={getStatusTone(selected.status)}>{getStatusLabel(selected.status)}</StatusPill>
                  <Tag color={getPriorityColor(selected.priority)}>{selected.priority || 'P2'}</Tag>
                  <span>进度 {projectProgress(selected)}%</span>
                </div>
              </div>
              <Space wrap className="project-detail-actions">
                <Button icon={<ShareAltOutlined />} onClick={() => message.info('分享能力等待后端链接接口接入')}>分享</Button>
                <Dropdown menu={{ items: actionMenu(selected) }} trigger={['click']}>
                  <Button>更多 <DownOutlined /></Button>
                </Dropdown>
                <Button icon={<FilePptOutlined />} loading={generatePptMutation.isPending} onClick={() => generatePptMutation.mutate()}>
                  生成 PPT 大纲
                </Button>
                <Button type="primary" icon={<PlayCircleOutlined />} loading={runFlowMutation.isPending} onClick={() => runFlowMutation.mutate()}>
                  启动方案生成
                </Button>
              </Space>
            </header>

            <Tabs
              activeKey={activeDetailTab}
              onChange={changeDetailTab}
              items={detailTabs}
              className="project-detail-tabs"
            />
          </section>
        )}
      </Drawer>
    </Space>
  );
}
