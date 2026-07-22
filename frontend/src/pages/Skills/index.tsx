import {
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  createSkill,
  deleteSkill,
  listSkills,
  testSkill,
  updateSkill,
  type Skill,
  type SkillPayload,
  type SkillTestResult
} from '../../api/skills';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

const { TextArea } = Input;

type SkillFormValues = SkillPayload & {
  requiresImaBool?: boolean;
  requiresLlmBool?: boolean;
  requiresGithubBool?: boolean;
};

const typeOptions = [
  { label: 'Prompt', value: 'PROMPT' },
  { label: 'IMA 检索', value: 'IMA_SEARCH' },
  { label: 'LLM 生成', value: 'LLM_GENERATE' },
  { label: 'GitHub 分析', value: 'GITHUB_ANALYSIS' }
];

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
];

const payloadKeys: Array<keyof SkillPayload> = [
  'name',
  'type',
  'category',
  'version',
  'description',
  'promptTemplate',
  'inputSchema',
  'outputSchema',
  'requiresIma',
  'requiresLlm',
  'requiresGithub',
  'imaKbIds',
  'llmConfigId',
  'timeoutSeconds',
  'retryCount',
  'status'
];

function boolToInt(value?: boolean) {
  return value ? 1 : 0;
}

function intToBool(value?: number) {
  return value === 1;
}

function getTypeLabel(value?: string) {
  return typeOptions.find((item) => item.value === value)?.label || value || '-';
}

function statusTone(value?: string): 'green' | 'muted' {
  return value === 'DISABLED' ? 'muted' : 'green';
}

function sanitizeSkillPayload(values: SkillFormValues): SkillPayload {
  const withFlags: SkillPayload = {
    ...values,
    requiresIma: boolToInt(values.requiresImaBool),
    requiresLlm: boolToInt(values.requiresLlmBool),
    requiresGithub: boolToInt(values.requiresGithubBool)
  };

  return payloadKeys.reduce<SkillPayload>((payload, key) => {
    const value = withFlags[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) payload[key] = trimmed as never;
      return payload;
    }
    if (value !== undefined && value !== null) payload[key] = value as never;
    return payload;
  }, {} as SkillPayload);
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function validateJsonText(value: string, label: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      message.error(`${label} 必须是 JSON 对象`);
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    message.error(`${label} 必须是合法 JSON`);
    return null;
  }
}

export default function SkillManagerPage() {
  const [form] = Form.useForm<SkillFormValues>();
  const [testForm] = Form.useForm<{ inputJson: string }>();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [selectedId, setSelectedId] = useState<string>();
  const [testResult, setTestResult] = useState<SkillTestResult | null>(null);

  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: listSkills });
  const skills = skillsQuery.data || [];

  useEffect(() => {
    if (!selectedId && skills[0]?.id) setSelectedId(skills[0].id);
    if (selectedId && !skills.some((skill) => skill.id === selectedId)) setSelectedId(skills[0]?.id);
  }, [selectedId, skills]);

  const selected = skills.find((skill) => skill.id === selectedId) || skills[0];
  const filteredSkills = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return skills;
    return skills.filter((skill) => [
      skill.name,
      skill.type,
      skill.category,
      skill.description,
      skill.promptTemplate
    ].some((value) => value?.toLowerCase().includes(text)));
  }, [keyword, skills]);

  const stats = useMemo(() => [
    { label: 'Skill 总数', value: skills.length, helper: '暂无运行指标', tone: 'cyan' as const },
    { label: '启用', value: skills.filter((item) => item.status !== 'DISABLED').length, helper: '可被 Flow 调用', tone: 'green' as const },
    { label: '需要 IMA', value: skills.filter((item) => item.requiresIma === 1).length, helper: '知识库检索依赖', tone: 'blue' as const },
    { label: '需要 LLM', value: skills.filter((item) => item.requiresLlm === 1).length, helper: '大模型生成依赖', tone: 'amber' as const }
  ], [skills]);

  const saveMutation = useMutation({
    mutationFn: (values: SkillFormValues) => {
      const payload = sanitizeSkillPayload(values);
      return editing ? updateSkill(editing.id, payload) : createSkill(payload);
    },
    onSuccess: (skill) => {
      message.success(editing ? 'Skill 已更新' : 'Skill 已创建');
      setSelectedId(skill.id);
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: (_, id) => {
      message.success('Skill 已删除');
      if (selectedId === id) setSelectedId(undefined);
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const testMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => testSkill(id, input),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.status === 'SUCCESS') {
        message.success(`测试运行成功，耗时 ${result.durationMs || 0} ms`);
      } else {
        message.warning(result.errorMessage || '测试运行失败');
      }
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'PROMPT',
      category: '需求分析',
      version: '1.0.0',
      promptTemplate: '请为 {{projectName}} 输出 GIS 解决方案要点。',
      inputSchema: '{"projectName":"string"}',
      outputSchema: '{"summary":"string"}',
      requiresImaBool: false,
      requiresLlmBool: true,
      requiresGithubBool: false,
      timeoutSeconds: 60,
      retryCount: 0,
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditing(skill);
    form.setFieldsValue({
      ...skill,
      requiresImaBool: intToBool(skill.requiresIma),
      requiresLlmBool: intToBool(skill.requiresLlm),
      requiresGithubBool: intToBool(skill.requiresGithub)
    });
    setModalOpen(true);
  };

  const submitTest = ({ inputJson }: { inputJson: string }) => {
    if (!selected) return;
    const parsed = validateJsonText(inputJson, '测试输入');
    if (!parsed) return;
    testMutation.mutate({ id: selected.id, input: parsed });
  };

  const selectSkill = (skill: Skill) => {
    setSelectedId(skill.id);
    setTestResult(null);
    testForm.setFieldsValue({
      inputJson: '{\n  "projectName": "智慧园区三维可视化平台",\n  "industry": "智慧城市",\n  "query": "GIS 解决方案"\n}'
    });
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page skill-center-page">
      <PageHeader
        eyebrow="AGENT SKILL CENTER"
        title="Agent 技能"
        description="以表格管理 Agent 可调用能力，右侧查看 Prompt、Schema、配置与测试结果。"
        actions={[
          <Input key="search" allowClear prefix={<SearchOutlined />} placeholder="搜索 Skill 名称、类型、描述" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="skill-search" />,
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => skillsQuery.refetch()}>刷新</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建技能</Button>
        ]}
      />

      <StatGrid items={stats} />

      {skillsQuery.isLoading && <Skeleton active paragraph={{ rows: 10 }} />}
      {skillsQuery.isError && (
        <Result status="error" title="Skill 列表加载失败" subTitle={(skillsQuery.error as Error).message} extra={<Button onClick={() => skillsQuery.refetch()}>重试</Button>} />
      )}
      {skillsQuery.isSuccess && skills.length === 0 && (
        <Card>
          <Empty description="还没有 Agent Skill">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建第一个 Skill</Button>
          </Empty>
        </Card>
      )}

      {skillsQuery.isSuccess && skills.length > 0 && (
        <div className="skill-workbench-grid">
          <Card className="gis-table-card skill-table-card">
            <Table<Skill>
              rowKey="id"
              dataSource={filteredSkills}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 980 }}
              rowClassName={(record) => record.id === selected?.id ? 'is-selected-row' : ''}
              onRow={(record) => ({ onClick: () => selectSkill(record) })}
              columns={[
                { title: '名称', dataIndex: 'name', fixed: 'left', width: 190, render: (value: string, record) => <Button type="link" className="gis-link-button" onClick={() => selectSkill(record)}>{value}</Button> },
                { title: '类型', dataIndex: 'type', width: 120, render: (value?: string) => <StatusPill tone="cyan">{getTypeLabel(value)}</StatusPill> },
                { title: '状态', dataIndex: 'status', width: 90, render: (value?: string) => <StatusPill tone={statusTone(value)}>{value === 'DISABLED' ? '停用' : '启用'}</StatusPill> },
                { title: 'IMA', dataIndex: 'requiresIma', width: 76, render: (value?: number) => value === 1 ? <Tag color="blue">1</Tag> : <Tag>0</Tag> },
                { title: 'LLM', dataIndex: 'requiresLlm', width: 76, render: (value?: number) => value === 1 ? <Tag color="green">1</Tag> : <Tag>0</Tag> },
                { title: 'GitHub', dataIndex: 'requiresGithub', width: 90, render: (value?: number) => value === 1 ? <Tag color="purple">1</Tag> : <Tag>0</Tag> },
                { title: '超时', dataIndex: 'timeoutSeconds', width: 90, render: (value?: number) => `${value || 60}s` },
                { title: '重试', dataIndex: 'retryCount', width: 80, render: (value?: number) => value ?? 0 },
                {
                  title: '操作',
                  fixed: 'right',
                  width: 156,
                  render: (_, record) => (
                    <Space size={8} onClick={(event) => event.stopPropagation()}>
                      <Button icon={<PlayCircleOutlined />} onClick={() => selectSkill(record)}>测试</Button>
                      <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                      <Popconfirm title="确认删除这个 Skill？" onConfirm={() => deleteMutation.mutate(record.id)}>
                        <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          </Card>

          <aside className="skill-detail-panel">
            {selected ? (
              <Space direction="vertical" size={14} className="content-stack">
                <Card className="skill-detail-card">
                  <div className="skill-detail-header">
                    <div>
                      <Typography.Text className="gis-section-kicker">SKILL DETAIL</Typography.Text>
                      <Typography.Title level={4}>{selected.name}</Typography.Title>
                      <Typography.Text type="secondary">{selected.description || '暂无描述'}</Typography.Text>
                    </div>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(selected)}>编辑</Button>
                  </div>
                  <Descriptions column={2} size="small" className="skill-detail-desc">
                    <Descriptions.Item label="类型">{getTypeLabel(selected.type)}</Descriptions.Item>
                    <Descriptions.Item label="分类">{selected.category || '-'}</Descriptions.Item>
                    <Descriptions.Item label="版本">{selected.version || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态">{selected.status === 'DISABLED' ? '停用' : '启用'}</Descriptions.Item>
                    <Descriptions.Item label="IMA">{selected.requiresIma === 1 ? '1' : '0'}</Descriptions.Item>
                    <Descriptions.Item label="LLM">{selected.requiresLlm === 1 ? '1' : '0'}</Descriptions.Item>
                    <Descriptions.Item label="GitHub">{selected.requiresGithub === 1 ? '1' : '0'}</Descriptions.Item>
                    <Descriptions.Item label="更新">{formatDate(selected.updatedAt)}</Descriptions.Item>
                  </Descriptions>
                  <Alert type="info" showIcon message="暂无运行指标" description="后端暂未提供成功率、调用次数和平均耗时统计，因此这里不伪造百分比。" />
                </Card>

                <Card title="Prompt 模板" className="skill-detail-card">
                  <pre className="skill-code-preview">{selected.promptTemplate || '-'}</pre>
                </Card>

                <Card title="输入 / 输出 Schema" className="skill-detail-card">
                  <div className="skill-schema-grid">
                    <pre className="skill-code-preview">{selected.inputSchema || '{}'}</pre>
                    <pre className="skill-code-preview">{selected.outputSchema || '{}'}</pre>
                  </div>
                </Card>

                <Card title="测试入口" className="skill-detail-card">
                  <Form form={testForm} layout="vertical" onFinish={submitTest} initialValues={{ inputJson: '{\n  "projectName": "智慧园区三维可视化平台",\n  "industry": "智慧城市",\n  "query": "GIS 解决方案"\n}' }}>
                    <Form.Item name="inputJson" label="测试输入 JSON" rules={[{ required: true, message: '请输入测试 JSON' }]}>
                      <TextArea rows={6} className="skill-test-input" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={testMutation.isPending}>运行测试</Button>
                  </Form>
                </Card>

                {testResult && (
                  <Card title="测试结果" className="skill-detail-card skill-test-result-card">
                    <Space direction="vertical" size={12} className="content-stack">
                      <Alert
                        type={testResult.status === 'SUCCESS' ? 'success' : 'error'}
                        showIcon
                        message={`状态：${testResult.status}`}
                        description={`耗时：${testResult.durationMs || 0} ms${testResult.errorMessage ? `，错误：${testResult.errorMessage}` : ''}`}
                      />
                      <section>
                        <Typography.Text strong>Rendered Prompt</Typography.Text>
                        <pre className="skill-code-preview">{testResult.renderedPrompt || '-'}</pre>
                      </section>
                      {testResult.imaResult && (
                        <section>
                          <Typography.Text strong>IMA Items（{testResult.imaResult.totalFound || 0}）</Typography.Text>
                          <Table
                            rowKey="id"
                            dataSource={testResult.imaResult.items || []}
                            size="small"
                            pagination={{ pageSize: 4 }}
                            columns={[
                              { title: '标题', dataIndex: 'title' },
                              { title: '类型', dataIndex: 'type', width: 82 },
                              { title: '得分', dataIndex: 'score', width: 82 },
                              { title: '知识库', dataIndex: 'kbName' }
                            ]}
                          />
                        </section>
                      )}
                      <section>
                        <Typography.Text strong>LLM Response</Typography.Text>
                        <pre className="skill-code-preview">{testResult.llmResponse || '未启用 LLM 或暂无输出'}</pre>
                      </section>
                    </Space>
                  </Card>
                )}
              </Space>
            ) : (
              <Card className="project-empty-state">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择左侧 Skill 查看详情" />
              </Card>
            )}
          </aside>
        </div>
      )}

      <Modal
        title={editing ? '编辑 Skill' : '新建 Skill'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={860}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Space size={16} className="form-row">
            <Form.Item name="name" label="名称" className="form-item-half" rules={[{ required: true, message: '请输入 Skill 名称' }]}><Input /></Form.Item>
            <Form.Item name="type" label="类型" className="form-item-half" rules={[{ required: true, message: '请选择类型' }]}><Select options={typeOptions} /></Form.Item>
          </Space>
          <Space size={16} className="form-row">
            <Form.Item name="category" label="分类" className="form-item-half"><Input /></Form.Item>
            <Form.Item name="version" label="版本" className="form-item-half"><Input /></Form.Item>
          </Space>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="promptTemplate" label="Prompt 模板" rules={[{ required: true, message: '请输入 Prompt 模板' }]}><TextArea rows={5} placeholder="支持 {{projectName}} 变量" /></Form.Item>
          <Space size={16} className="form-row">
            <Form.Item name="inputSchema" label="输入 Schema" className="form-item-half"><TextArea rows={3} /></Form.Item>
            <Form.Item name="outputSchema" label="输出 Schema" className="form-item-half"><TextArea rows={3} /></Form.Item>
          </Space>
          <Space size={24} wrap>
            <Form.Item name="requiresImaBool" label="需要 IMA" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="requiresLlmBool" label="需要 LLM" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="requiresGithubBool" label="需要 GitHub" valuePropName="checked"><Switch /></Form.Item>
          </Space>
          <Form.Item name="imaKbIds" label="IMA 知识库 ID"><Input placeholder="多个用逗号分隔，例如 kb-001,kb-002" /></Form.Item>
          <Form.Item name="llmConfigId" label="LLM 配置 ID"><Input placeholder="留空则使用最新启用配置" /></Form.Item>
          <Space size={16} className="form-row">
            <Form.Item name="timeoutSeconds" label="超时时间（秒）" className="form-item-half"><InputNumber min={5} max={600} className="full-width" /></Form.Item>
            <Form.Item name="retryCount" label="重试次数" className="form-item-half"><InputNumber min={0} max={5} className="full-width" /></Form.Item>
            <Form.Item name="status" label="状态" className="form-item-half"><Select options={statusOptions} /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
