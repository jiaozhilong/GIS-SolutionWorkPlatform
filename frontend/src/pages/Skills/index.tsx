import { DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Modal, Popconfirm, Result, Select, Skeleton, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { createSkill, deleteSkill, listSkills, testSkill, updateSkill, type Skill, type SkillPayload, type SkillTestResult } from '../../api/skills';

const { TextArea } = Input;

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

function boolToInt(value?: boolean) {
  return value ? 1 : 0;
}

function intToBool(value?: number) {
  return value === 1;
}

export default function SkillManagerPage() {
  const [form] = Form.useForm<SkillPayload & { requiresImaBool?: boolean; requiresLlmBool?: boolean; requiresGithubBool?: boolean }>();
  const [testForm] = Form.useForm<{ inputJson: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [testing, setTesting] = useState<Skill | null>(null);
  const [testResult, setTestResult] = useState<SkillTestResult | null>(null);

  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: listSkills
  });

  const skills = skillsQuery.data || [];
  const stats = useMemo(() => {
    return [
      { label: 'Skill 总数', value: skills.length, tone: 'cyan' },
      { label: '启用', value: skills.filter((item) => item.status !== 'DISABLED').length, tone: 'green' },
      { label: '需要 IMA', value: skills.filter((item) => item.requiresIma === 1).length, tone: 'blue' },
      { label: '需要 LLM', value: skills.filter((item) => item.requiresLlm === 1).length, tone: 'amber' }
    ];
  }, [skills]);

  const saveMutation = useMutation({
    mutationFn: (payload: SkillPayload) => (editing ? updateSkill(editing.id, payload) : createSkill(payload)),
    onSuccess: () => {
      message.success(editing ? 'Skill 已更新' : 'Skill 已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      message.success('Skill 已删除');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => testSkill(id, input),
    onSuccess: (result) => {
      setTestResult(result);
      if (result.status === 'SUCCESS') {
        message.success(`测试运行成功，耗时 ${result.durationMs} ms`);
      } else {
        message.warning(result.errorMessage || '测试运行失败');
      }
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'PROMPT',
      category: '需求分析',
      version: '1.0.0',
      promptTemplate: '请为 {{projectName}} 输出 GIS 方案要点。',
      inputSchema: '{"projectName":"string"}',
      outputSchema: '{"summary":"string"}',
      requiresImaBool: false,
      requiresLlmBool: false,
      requiresGithubBool: false,
      timeoutSeconds: 60,
      retryCount: 0,
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setEditing(skill);
    form.setFieldsValue({ ...skill, requiresImaBool: intToBool(skill.requiresIma), requiresLlmBool: intToBool(skill.requiresLlm), requiresGithubBool: intToBool(skill.requiresGithub) });
    setModalOpen(true);
  };

  const openTest = (skill: Skill) => {
    setTesting(skill);
    setTestResult(null);
    testForm.setFieldsValue({ inputJson: '{\n  "projectName": "智慧城市时空平台",\n  "industry": "智慧城市",\n  "query": "智慧城市时空大数据"\n}' });
  };

  const submitSkill = (values: SkillPayload & { requiresImaBool?: boolean; requiresLlmBool?: boolean; requiresGithubBool?: boolean }) => {
    const payload: SkillPayload = {
      ...values,
      requiresIma: boolToInt(values.requiresImaBool),
      requiresLlm: boolToInt(values.requiresLlmBool),
      requiresGithub: boolToInt(values.requiresGithubBool)
    };
    delete (payload as SkillPayload & { requiresImaBool?: boolean }).requiresImaBool;
    delete (payload as SkillPayload & { requiresLlmBool?: boolean }).requiresLlmBool;
    delete (payload as SkillPayload & { requiresGithubBool?: boolean }).requiresGithubBool;
    saveMutation.mutate(payload);
  };

  const submitTest = ({ inputJson }: { inputJson: string }) => {
    if (!testing) return;
    try {
      const input = JSON.parse(inputJson || '{}') as Record<string, unknown>;
      testMutation.mutate({ id: testing.id, input });
    } catch {
      message.error('测试输入必须是合法 JSON');
    }
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Text className="gis-section-kicker">SKILL CENTER</Typography.Text>
          <Typography.Title level={3}>技能管理</Typography.Title>
          <Typography.Text type="secondary">维护可复用的 GIS AI 能力单元，支持 Prompt 模板变量和测试运行。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => skillsQuery.refetch()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建 Skill</Button>
        </Space>
      </div>

      <div className="gis-stat-grid">
        {stats.map((item) => (
          <Card key={item.label} className={`gis-glass-card gis-stat-card is-${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </Card>
        ))}
      </div>

      {skillsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {skillsQuery.isError && <Result status="error" title="Skill 列表加载失败" subTitle={(skillsQuery.error as Error).message} extra={<Button onClick={() => skillsQuery.refetch()}>重试</Button>} />}
      {skillsQuery.isSuccess && skills.length === 0 && (
        <Card className="gis-glass-card">
          <Empty description="还没有 Skill">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建第一个 Skill</Button>
          </Empty>
        </Card>
      )}
      {skillsQuery.isSuccess && skills.length > 0 && (
        <Card className="gis-glass-card gis-table-card">
          <Table<Skill>
            rowKey="id"
            dataSource={skills}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '名称', dataIndex: 'name' },
              { title: '类型', dataIndex: 'type', width: 130, render: (value) => <Tag color="cyan">{value}</Tag> },
              { title: '分类', dataIndex: 'category', width: 120 },
              { title: '依赖', width: 190, render: (_, record) => <Space>{record.requiresIma === 1 && <Tag color="blue">IMA</Tag>}{record.requiresLlm === 1 && <Tag color="green">LLM</Tag>}{record.requiresGithub === 1 && <Tag color="purple">GitHub</Tag>}</Space> },
              { title: '状态', dataIndex: 'status', width: 90, render: (value) => <Tag color={value === 'DISABLED' ? 'default' : 'green'}>{value || 'ACTIVE'}</Tag> },
              {
                title: '操作',
                width: 220,
                render: (_, record) => (
                  <Space>
                    <Button icon={<PlayCircleOutlined />} onClick={() => openTest(record)}>测试</Button>
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
      )}

      <Modal title={editing ? '编辑 Skill' : '新建 Skill'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} confirmLoading={saveMutation.isPending} width={820} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={submitSkill} preserve={false}>
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

      <Modal title={`测试运行${testing ? ` - ${testing.name}` : ''}`} open={!!testing} onCancel={() => setTesting(null)} footer={null} width={900} destroyOnClose>
        <Form form={testForm} layout="vertical" onFinish={submitTest}>
          <Form.Item name="inputJson" label="测试输入 JSON" rules={[{ required: true, message: '请输入测试 JSON' }]}><TextArea rows={7} /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={testMutation.isPending}>运行测试</Button>
        </Form>
        {testResult && (
          <Space direction="vertical" size={12} className="content-stack search-result-card">
            <Alert type={testResult.status === 'SUCCESS' ? 'success' : 'error'} showIcon message={`状态：${testResult.status}`} description={`耗时：${testResult.durationMs} ms${testResult.errorMessage ? `，错误：${testResult.errorMessage}` : ''}`} />
            <Card className="gis-glass-card" title="渲染后的 Prompt"><pre className="github-readme-preview">{testResult.renderedPrompt}</pre></Card>
            {testResult.imaResult && <Card className="gis-glass-card" title={`IMA 检索结果（${testResult.imaResult.totalFound}）`}><Table rowKey="id" dataSource={testResult.imaResult.items} pagination={false} columns={[{ title: '标题', dataIndex: 'title' }, { title: '类型', dataIndex: 'type', width: 90 }, { title: '得分', dataIndex: 'score', width: 90 }, { title: '知识库', dataIndex: 'kbName' }]} /></Card>}
            {testResult.llmResponse && <Card className="gis-glass-card" title="LLM 输出"><pre className="github-readme-preview">{testResult.llmResponse}</pre></Card>}
          </Space>
        )}
      </Modal>
    </Space>
  );
}
