import {
  ApiOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined
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
  Modal,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Slider,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { useMemo, useState } from 'react';
import {
  createLlmConfig,
  deleteLlmConfig,
  listLlmConfigs,
  testLlmConfig,
  updateLlmConfig,
  type LlmConfig,
  type LlmConfigPayload,
  type LlmTestResult
} from '../../api/llm';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

type LlmFormValues = Omit<LlmConfigPayload, 'isActive'> & {
  isActive?: boolean;
};

type LlmTestFormValues = {
  input?: string;
};

const usageSceneOptions = [
  { label: '分析场景', value: 'analysis' },
  { label: '生成场景', value: 'generation' },
  { label: '总结场景', value: 'summary' }
];

const usageSceneLabel: Record<string, string> = {
  analysis: '分析',
  generation: '生成',
  summary: '总结'
};

function inferProvider(apiBase?: string) {
  if (!apiBase) return '未配置服务商';
  try {
    const host = new URL(apiBase).hostname.replace(/^api\./, '');
    if (host.includes('deepseek')) return 'DeepSeek-compatible';
    if (host.includes('openai')) return 'OpenAI-compatible';
    if (host.includes('dashscope') || host.includes('aliyun')) return '通义千问-compatible';
    if (host.includes('moonshot')) return 'Moonshot-compatible';
    return host;
  } catch {
    return '自定义 API Base';
  }
}

function toFlag(value?: boolean | number) {
  return value ? 1 : 0;
}

function compactPayload(values: LlmFormValues, editing: boolean): LlmConfigPayload {
  const payload: LlmConfigPayload = {
    name: values.name.trim(),
    apiBase: values.apiBase.trim(),
    modelName: values.modelName.trim(),
    temperature: values.temperature,
    maxTokens: values.maxTokens,
    systemPrompt: values.systemPrompt?.trim() || undefined,
    timeoutSeconds: values.timeoutSeconds,
    usageScene: values.usageScene || 'generation',
    isActive: toFlag(values.isActive)
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  } else if (!editing) {
    payload.apiKey = '';
  }

  return payload;
}

function formatLatency(value?: number) {
  if (typeof value !== 'number') return '-';
  return `${value} ms`;
}

export default function LlmConfigPage() {
  const [form] = Form.useForm<LlmFormValues>();
  const [testForm] = Form.useForm<LlmTestFormValues>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LlmConfig | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>();
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);

  const configsQuery = useQuery({
    queryKey: ['llm-configs'],
    queryFn: listLlmConfigs
  });

  const configs = configsQuery.data || [];
  const selectedConfig = configs.find((item) => item.id === selectedConfigId) || configs.find((item) => item.isActive !== 0) || configs[0];

  const stats = useMemo(() => [
    { label: '配置总数', value: configs.length, helper: 'OpenAI-compatible 连接', tone: 'cyan' as const },
    { label: '分析场景', value: configs.filter((item) => item.usageScene === 'analysis').length, helper: '需求与架构分析', tone: 'green' as const },
    { label: '生成场景', value: configs.filter((item) => !item.usageScene || item.usageScene === 'generation').length, helper: '方案与 PPT 生成', tone: 'blue' as const },
    { label: '启用配置', value: configs.filter((item) => item.isActive !== 0).length, helper: '可供 Agent 调用', tone: 'amber' as const }
  ], [configs]);

  const saveMutation = useMutation({
    mutationFn: (values: LlmFormValues) => {
      const payload = compactPayload(values, !!editing);
      return editing ? updateLlmConfig(editing.id, payload) : createLlmConfig(payload);
    },
    onSuccess: (config) => {
      message.success(editing ? '模型配置已更新' : '模型配置已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setSelectedConfigId(config.id);
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLlmConfig,
    onSuccess: () => {
      message.success('模型配置已删除');
      setTestResult(null);
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => testLlmConfig(id),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.connected) {
        message.success(`连接成功，延迟 ${formatLatency(result.latencyMs)}`);
      } else {
        message.warning(result.message || '连接测试未通过');
      }
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    setEditing(null);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({
      apiBase: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 8192,
      timeoutSeconds: 120,
      usageScene: 'generation',
      isActive: true
    });
    setModalOpen(true);
  };

  const openEdit = (config: LlmConfig) => {
    setEditing(config);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({
      name: config.name,
      apiBase: config.apiBase,
      apiKey: undefined,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      systemPrompt: config.systemPrompt,
      timeoutSeconds: config.timeoutSeconds,
      usageScene: config.usageScene || 'generation',
      isActive: config.isActive !== 0
    });
    setModalOpen(true);
  };

  const runTest = () => {
    if (!selectedConfig) {
      message.warning('请先选择一个模型配置');
      return;
    }
    testMutation.mutate(selectedConfig.id);
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page llm-config-page">
      <PageHeader
        eyebrow="MODEL ROUTING"
        title="模型配置"
        description="配置分析、生成和总结场景的模型连接，统一管理 API Base、模型参数、System Prompt 与连通性测试。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => configsQuery.refetch()}>刷新</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增配置</Button>
        ]}
      />

      <StatGrid items={stats} />

      {configsQuery.isLoading && <Skeleton active paragraph={{ rows: 9 }} />}

      {configsQuery.isError && (
        <Result
          status="error"
          title="模型配置加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && (
        <>
          <Card
            className="gis-table-card llm-table-card"
            title={
              <Space>
                <RobotOutlined />
                <span>模型连接表</span>
              </Space>
            }
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模型</Button>}
          >
            {configs.length === 0 ? (
              <Empty description="还没有模型配置">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建第一条配置</Button>
              </Empty>
            ) : (
              <Table<LlmConfig>
                rowKey="id"
                dataSource={configs}
                pagination={{ pageSize: 8 }}
                rowClassName={(record) => record.id === selectedConfig?.id ? 'is-selected-row' : ''}
                onRow={(record) => ({ onClick: () => setSelectedConfigId(record.id) })}
                columns={[
                  {
                    title: '配置名',
                    dataIndex: 'name',
                    width: 180,
                    render: (value: string, record) => (
                      <Button type="link" className="gis-link-button" onClick={(event) => { event.stopPropagation(); setSelectedConfigId(record.id); }}>
                        {value}
                      </Button>
                    )
                  },
                  {
                    title: 'API Base / 服务商提示',
                    dataIndex: 'apiBase',
                    width: 300,
                    render: (value?: string) => (
                      <div className="llm-api-cell">
                        <strong>{value || '-'}</strong>
                        <span>{inferProvider(value)}</span>
                      </div>
                    )
                  },
                  { title: '模型名', dataIndex: 'modelName', width: 170 },
                  {
                    title: '场景',
                    dataIndex: 'usageScene',
                    width: 110,
                    render: (value?: string) => <StatusPill tone="cyan">{usageSceneLabel[value || 'generation'] || value || '生成'}</StatusPill>
                  },
                  {
                    title: 'Temperature',
                    dataIndex: 'temperature',
                    width: 124,
                    render: (value?: number) => typeof value === 'number' ? value.toFixed(1) : '-'
                  },
                  { title: 'Max Tokens', dataIndex: 'maxTokens', width: 120, render: (value?: number) => value || '-' },
                  {
                    title: '状态',
                    dataIndex: 'isActive',
                    width: 104,
                    render: (value?: number) => <StatusPill tone={value === 0 ? 'muted' : 'green'}>{value === 0 ? '停用' : '启用'}</StatusPill>
                  },
                  {
                    title: '操作',
                    width: 236,
                    render: (_, record) => (
                      <Space size={8} onClick={(event) => event.stopPropagation()}>
                        <Button onClick={() => { setSelectedConfigId(record.id); testMutation.mutate(record.id); }} loading={testMutation.isPending}>测试</Button>
                        <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
                        <Popconfirm title="确认删除这个模型配置？" onConfirm={() => deleteMutation.mutate(record.id)}>
                          <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
              />
            )}
          </Card>

          <div className="llm-test-grid">
            <Card
              className="llm-test-card"
              title={
                <Space>
                  <ExperimentOutlined />
                  <span>测试输入</span>
                </Space>
              }
              extra={selectedConfig ? <Tag color="green">{selectedConfig.name}</Tag> : <Tag>未选择配置</Tag>}
            >
              <Form
                form={testForm}
                layout="vertical"
                onFinish={runTest}
                initialValues={{ input: '请用一句话说明这个模型连接是否可用于 GIS 解决方案生成。' }}
              >
                <Alert
                  type="info"
                  showIcon
                  className="llm-test-hint"
                  message="测试接口说明"
                  description="后端测试接口当前只接收配置 id，不接收自定义输入。这里的测试输入用于产品侧提示和后续接口扩展，不会被提交到后端。"
                />
                <Form.Item name="input" label="测试提示词">
                  <Input.TextArea rows={4} placeholder="输入一段用于联调模型的测试提示词" />
                </Form.Item>
                <Space wrap>
                  <Button type="primary" htmlType="submit" icon={<ApiOutlined />} loading={testMutation.isPending}>运行测试</Button>
                  <Button onClick={() => testForm.resetFields()}>重置输入</Button>
                </Space>
              </Form>
            </Card>

            <Card
              className="llm-test-card llm-result-card"
              title={
                <Space>
                  <CheckCircleOutlined />
                  <span>连接 / 延迟 / 响应预览</span>
                </Space>
              }
            >
              {!testResult ? (
                <Empty description="运行测试后展示 connected、latencyMs、message、responsePreview。" />
              ) : (
                <Space direction="vertical" size={12} className="llm-result-stack">
                  <div className="llm-result-summary">
                    <StatusPill tone={testResult.connected ? 'green' : 'red'}>{testResult.connected ? 'Connected' : 'Failed'}</StatusPill>
                    <span><ClockCircleOutlined /> {formatLatency(testResult.latencyMs)}</span>
                  </div>
                  <Alert
                    type={testResult.connected ? 'success' : 'warning'}
                    showIcon
                    message={testResult.message || (testResult.connected ? '连接测试成功' : '连接测试未通过')}
                  />
                  <pre className="llm-response-preview">{testResult.responsePreview || '暂无响应预览'}</pre>
                </Space>
              )}
            </Card>
          </div>
        </>
      )}

      <Modal
        title={editing ? '编辑模型配置' : '新建模型配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} onFinish={(values) => saveMutation.mutate(values)}>
          {editing && (
            <Alert
              type="warning"
              showIcon
              className="llm-secret-alert"
              message="API Key 保护"
              description={`当前密钥只展示为 ${editing.apiKeyMasked || '******'}。编辑时 API Key 留空表示不更新，页面不会回填或提交掩码。`}
            />
          )}
          <div className="llm-form-grid">
            <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
              <Input placeholder="例如：DeepSeek 方案生成模型" />
            </Form.Item>
            <Form.Item name="usageScene" label="使用场景">
              <Select options={usageSceneOptions} />
            </Form.Item>
            <Form.Item name="apiBase" label="API Base" rules={[{ required: true, message: '请输入 API Base' }]}>
              <Input placeholder="https://api.deepseek.com/v1" />
            </Form.Item>
            <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
              <Input placeholder="deepseek-chat" />
            </Form.Item>
          </div>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editing ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editing ? '留空表示保留原密钥；只有输入新值时才提交 apiKey。' : '新增配置时 API Key 必填。'}
          >
            <Input.Password placeholder="sk-xxx" autoComplete="new-password" />
          </Form.Item>
          <div className="llm-form-grid">
            <Form.Item name="temperature" label="Temperature" rules={[{ type: 'number', min: 0, max: 2, message: 'Temperature 必须在 0-2 之间' }]}>
              <Slider min={0} max={2} step={0.1} marks={{ 0: '0', 1: '1', 2: '2' }} />
            </Form.Item>
            <Form.Item name="maxTokens" label="Max Tokens" rules={[{ type: 'number', min: 1, max: 128000, message: 'Max Tokens 需在 1-128000 之间' }]}>
              <InputNumber min={1} max={128000} className="full-width" />
            </Form.Item>
            <Form.Item name="timeoutSeconds" label="超时时间（秒）" rules={[{ type: 'number', min: 5, max: 600, message: '超时时间需在 5-600 秒之间' }]}>
              <InputNumber min={5} max={600} className="full-width" />
            </Form.Item>
            <Form.Item name="isActive" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          </div>
          <Form.Item name="systemPrompt" label="System Prompt">
            <Input.TextArea rows={4} placeholder="你是一个专业的 GIS 解决方案顾问，擅长从客户需求生成可交付方案。" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
