import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Input,
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
import { useMemo, useState } from 'react';
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
  type Template,
  type TemplatePayload,
  type TemplateQuery
} from '../../api/templates';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

const { TextArea } = Input;

type TemplateFormValues = TemplatePayload & { isSystemBool?: boolean };

const typeOptions = [
  { label: '方案模板', value: 'PROPOSAL' },
  { label: '投标模板', value: 'BID' },
  { label: 'PPT 模板', value: 'PPT' },
  { label: '实施模板', value: 'IMPLEMENTATION' }
];

const categoryOptions = ['智慧城市', '自然资源', '园区', '水利环保', '投标', '通用'].map((value) => ({ label: value, value }));

function getTypeLabel(value?: string) {
  return typeOptions.find((item) => item.value === value)?.label || value || '-';
}

function parseVariables(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function extractVariables(content?: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  const pattern = /\{\{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
  let match = pattern.exec(content || '');
  while (match) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      result.push(match[1]);
    }
    match = pattern.exec(content || '');
  }
  return result;
}

function validateVariablesJson(value?: string): string | null {
  if (!value || !value.trim()) return '[]';
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      message.error('变量 JSON 必须是数组，例如 ["projectName","customerName"]');
      return null;
    }
    return JSON.stringify(parsed.map(String));
  } catch {
    message.error('变量 JSON 必须是合法 JSON');
    return null;
  }
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

export default function TemplateManagerPage() {
  const [form] = Form.useForm<TemplateFormValues>();
  const [filterForm] = Form.useForm<TemplateQuery>();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TemplateQuery>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [previewing, setPreviewing] = useState<Template | null>(null);

  const templatesQuery = useQuery({
    queryKey: ['templates', filters],
    queryFn: () => listTemplates(filters)
  });
  const templates = templatesQuery.data || [];

  const stats = useMemo(() => [
    { label: '全部模板', value: templates.length, helper: '可复用交付资产', tone: 'cyan' as const },
    { label: '方案模板', value: templates.filter((item) => item.type === 'PROPOSAL').length, helper: '解决方案正文', tone: 'green' as const },
    { label: '投标模板', value: templates.filter((item) => item.type === 'BID').length, helper: '招投标材料', tone: 'blue' as const },
    { label: 'PPT 模板', value: templates.filter((item) => item.type === 'PPT').length, helper: '汇报演示资产', tone: 'amber' as const },
    { label: '实施模板', value: templates.filter((item) => item.type === 'IMPLEMENTATION').length, helper: '交付实施文档', tone: 'red' as const }
  ], [templates]);

  const saveMutation = useMutation({
    mutationFn: (values: TemplateFormValues) => {
      const variablesJson = validateVariablesJson(values.variablesJson);
      if (variablesJson === null) throw new Error('变量 JSON 校验失败');
      const payload: TemplatePayload = {
        name: values.name,
        type: values.type,
        category: values.category,
        content: values.content,
        variablesJson,
        isSystem: values.isSystemBool ? 1 : 0
      };
      return editing ? updateTemplate(editing.id, payload) : createTemplate(payload);
    },
    onSuccess: (template) => {
      message.success(editing ? '模板已更新' : '模板已创建');
      setPreviewing(template);
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      message.success('模板已删除');
      if (previewing?.id === id) setPreviewing(null);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    const content = '# {{projectName}}\n\n## 项目背景\n面向 {{customerName}} 的 {{businessScenario}} 建设需求。\n\n## 建设内容\n- 数据治理\n- GIS 平台升级\n- 业务应用联动';
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      name: '智慧城市解决方案模板',
      type: 'PROPOSAL',
      category: '智慧城市',
      content,
      variablesJson: JSON.stringify(extractVariables(content), null, 2),
      isSystemBool: false
    });
    setModalOpen(true);
  };

  const openEdit = (template: Template) => {
    setEditing(template);
    form.setFieldsValue({
      ...template,
      variablesJson: template.variablesJson || JSON.stringify(extractVariables(template.content), null, 2),
      isSystemBool: template.isSystem === 1
    });
    setModalOpen(true);
  };

  const submitFilters = (values: TemplateQuery) => {
    setFilters({
      type: values.type,
      category: values.category,
      keyword: values.keyword?.trim() || undefined
    });
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };

  const syncVariablesFromContent = () => {
    const content = form.getFieldValue('content');
    form.setFieldValue('variablesJson', JSON.stringify(extractVariables(content), null, 2));
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page template-library-page">
      <PageHeader
        eyebrow="TEMPLATE LIBRARY"
        title="方案模板"
        description="统计、筛选和预览可复用的方案、投标、PPT 与实施交付模板。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => templatesQuery.refetch()}>刷新</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>
        ]}
      />

      <StatGrid items={stats} />

      <Card className="toolbar-card template-filter-card">
        <Form form={filterForm} layout="inline" onFinish={submitFilters} className="template-filter-form">
          <Form.Item name="keyword" className="template-keyword">
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索名称或内容" />
          </Form.Item>
          <Form.Item name="type"><Select allowClear placeholder="模板类型" options={typeOptions} /></Form.Item>
          <Form.Item name="category"><Select allowClear placeholder="行业分类" options={categoryOptions} /></Form.Item>
          <Form.Item className="template-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit">筛选</Button>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {templatesQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {templatesQuery.isError && <Result status="error" title="模板列表加载失败" subTitle={(templatesQuery.error as Error).message} extra={<Button onClick={() => templatesQuery.refetch()}>重试</Button>} />}
      {templatesQuery.isSuccess && templates.length === 0 && (
        <Card><Empty description="还没有模板"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建第一个模板</Button></Empty></Card>
      )}
      {templatesQuery.isSuccess && templates.length > 0 && (
        <Card className="gis-table-card template-table-card">
          <Table<Template>
            rowKey="id"
            dataSource={templates}
            pagination={{ pageSize: 9 }}
            scroll={{ x: 1080 }}
            columns={[
              { title: '名称', dataIndex: 'name', fixed: 'left', width: 260, render: (value: string, record) => <Button type="link" className="gis-link-button" onClick={() => setPreviewing(record)}>{value}</Button> },
              { title: '类型', dataIndex: 'type', width: 130, render: (value?: string) => <StatusPill tone="cyan">{getTypeLabel(value)}</StatusPill> },
              { title: '分类', dataIndex: 'category', width: 120, render: (value?: string) => value || '-' },
              { title: '变量', dataIndex: 'variablesJson', width: 260, render: (value?: string) => <Space wrap>{parseVariables(value).slice(0, 4).map((item) => <Tag key={item} color="blue">{item}</Tag>)}</Space> },
              { title: '系统模板', dataIndex: 'isSystem', width: 110, render: (value?: number) => <StatusPill tone={value === 1 ? 'green' : 'muted'}>{value === 1 ? '是' : '否'}</StatusPill> },
              { title: '更新时间', dataIndex: 'updatedAt', width: 170, render: formatDate },
              {
                title: '操作',
                fixed: 'right',
                width: 176,
                render: (_, record) => (
                  <Space size={8}>
                    <Button icon={<EyeOutlined />} onClick={() => setPreviewing(record)} />
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm
                      title={record.isSystem === 1 ? '系统模板不能删除' : '确认删除这个模板？'}
                      disabled={record.isSystem === 1}
                      onConfirm={() => deleteMutation.mutate(record.id)}
                    >
                      <Button danger icon={<DeleteOutlined />} disabled={record.isSystem === 1} loading={deleteMutation.isPending} />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}

      <Modal
        title={editing ? '编辑模板' : '新建模板'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={900}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Space size={16} className="form-row">
            <Form.Item name="name" label="模板名称" className="form-item-half" rules={[{ required: true, message: '请输入模板名称' }]}><Input /></Form.Item>
            <Form.Item name="type" label="模板类型" className="form-item-half" rules={[{ required: true, message: '请选择模板类型' }]}><Select options={typeOptions} /></Form.Item>
          </Space>
          <Space size={16} className="form-row">
            <Form.Item name="category" label="行业分类" className="form-item-half"><Select allowClear showSearch options={categoryOptions} /></Form.Item>
            <Form.Item name="isSystemBool" label="系统模板" valuePropName="checked"><Switch disabled={editing?.isSystem === 1} /></Form.Item>
          </Space>
          <Form.Item name="content" label="模板内容" rules={[{ required: true, message: '请输入模板内容' }]}>
            <TextArea rows={12} placeholder="支持 {{projectName}}、{{customerName}} 等变量" />
          </Form.Item>
          <Form.Item
            name="variablesJson"
            label="变量 JSON"
            tooltip={'必须是 JSON 数组，例如 ["projectName","customerName"]'}
            rules={[{ required: true, message: '请输入变量 JSON' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          <Button onClick={syncVariablesFromContent}>从正文自动提取变量</Button>
        </Form>
      </Modal>

      <Drawer
        title="模板预览"
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        width={520}
        className="template-preview-drawer"
        extra={<Button type="primary" onClick={() => message.info('使用模板入口将由方案生成流程接入')}>使用模板</Button>}
      >
        {previewing && (
          <Space direction="vertical" size={14} className="content-stack">
            <Card className="template-preview-summary">
              <Typography.Text className="gis-section-kicker">TEMPLATE PREVIEW</Typography.Text>
              <Typography.Title level={4}>{previewing.name}</Typography.Title>
              <Space wrap>
                <StatusPill tone="cyan">{getTypeLabel(previewing.type)}</StatusPill>
                {previewing.category && <Tag color="blue">{previewing.category}</Tag>}
                <StatusPill tone={previewing.isSystem === 1 ? 'green' : 'muted'}>{previewing.isSystem === 1 ? '系统模板' : '自定义模板'}</StatusPill>
              </Space>
            </Card>
            <Card title="变量" className="template-preview-card">
              <Space wrap>
                {parseVariables(previewing.variablesJson).map((item) => <Tag key={item} color="purple">{item}</Tag>)}
                {parseVariables(previewing.variablesJson).length === 0 && <Typography.Text type="secondary">暂无变量</Typography.Text>}
              </Space>
            </Card>
            <Card title="正文内容" className="template-preview-card">
              <pre className="template-content-preview">{previewing.content}</pre>
            </Card>
            <Alert type="info" showIcon message="版本和使用次数后端未提供" description="本轮不伪造版本或使用次数，列表使用更新时间和系统模板属性替代。" />
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
