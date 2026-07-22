import {
  ApiOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
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
  createImaConfig,
  deleteImaConfig,
  listImaConfigs,
  searchIma,
  testImaConfig,
  updateImaConfig,
  type ImaConfig,
  type ImaConfigPayload,
  type ImaSearchItem,
  type ImaSearchResult
} from '../../api/ima';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

type ImaFormValues = Omit<ImaConfigPayload, 'isDefault' | 'isActive'> & {
  isDefault?: boolean;
  isActive?: boolean;
};

type ImaSearchFormValues = {
  kbIds?: string[];
  query: string;
};

const kbTypeOptions = [
  { label: '我的知识库', value: 'mine' },
  { label: '共享知识库', value: 'shared' },
  { label: '订阅知识库', value: 'subscribed' }
];

const kbTypeLabel: Record<string, string> = {
  mine: '我的知识库',
  shared: '共享知识库',
  subscribed: '订阅知识库'
};

function toFlag(value?: boolean | number) {
  return value ? 1 : 0;
}

function boolFromFlag(value?: number) {
  return value !== 0;
}

function compactPayload(values: ImaFormValues, editing: boolean): ImaConfigPayload {
  const payload: ImaConfigPayload = {
    name: values.name.trim(),
    kbId: values.kbId?.trim() || undefined,
    kbName: values.kbName?.trim() || undefined,
    kbType: values.kbType || 'mine',
    industryTag: values.industryTag?.trim() || undefined,
    isDefault: toFlag(values.isDefault),
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

function formatScore(score?: number) {
  if (typeof score !== 'number') return '-';
  return `${Math.round(score * 100)}%`;
}

export default function ImaConfigPage() {
  const [form] = Form.useForm<ImaFormValues>();
  const [searchForm] = Form.useForm<ImaSearchFormValues>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImaConfig | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>();
  const [searchResult, setSearchResult] = useState<ImaSearchResult | null>(null);

  const configsQuery = useQuery({
    queryKey: ['ima-configs'],
    queryFn: listImaConfigs
  });

  const configs = configsQuery.data || [];
  const selectedConfig = configs.find((item) => item.id === selectedConfigId) || configs.find((item) => item.isDefault === 1) || configs[0];

  const stats = useMemo(() => [
    { label: '我的知识库', value: configs.filter((item) => (item.kbType || 'mine') === 'mine').length, helper: '个人方案资产', tone: 'green' as const },
    { label: '共享知识库', value: configs.filter((item) => item.kbType === 'shared').length, helper: '团队共享资料', tone: 'cyan' as const },
    { label: '订阅知识库', value: configs.filter((item) => item.kbType === 'subscribed').length, helper: '外部订阅来源', tone: 'blue' as const },
    { label: '可用连接', value: configs.filter((item) => item.isActive !== 0).length, helper: '可用于 Agent 检索', tone: 'amber' as const }
  ], [configs]);

  const saveMutation = useMutation({
    mutationFn: (values: ImaFormValues) => {
      const payload = compactPayload(values, !!editing);
      return editing ? updateImaConfig(editing.id, payload) : createImaConfig(payload);
    },
    onSuccess: (config) => {
      message.success(editing ? 'IMA 连接已更新' : 'IMA 连接已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setSelectedConfigId(config.id);
      queryClient.invalidateQueries({ queryKey: ['ima-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImaConfig,
    onSuccess: () => {
      message.success('IMA 连接已删除');
      setSearchResult(null);
      queryClient.invalidateQueries({ queryKey: ['ima-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const testMutation = useMutation({
    mutationFn: testImaConfig,
    onSuccess: () => message.success('连接测试成功'),
    onError: (error) => message.error((error as Error).message)
  });

  const searchMutation = useMutation({
    mutationFn: (values: ImaSearchFormValues) => searchIma(values.kbIds || [], values.query.trim()),
    onSuccess: (result) => setSearchResult(result),
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ kbType: 'mine', isDefault: false, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (config: ImaConfig) => {
    setEditing(config);
    form.resetFields();
    form.setFieldsValue({
      name: config.name,
      apiKey: undefined,
      kbId: config.kbId,
      kbName: config.kbName,
      kbType: config.kbType || 'mine',
      industryTag: config.industryTag,
      isDefault: config.isDefault === 1,
      isActive: boolFromFlag(config.isActive)
    });
    setModalOpen(true);
  };

  const runSearch = (values: ImaSearchFormValues) => {
    if (!values.query?.trim()) return;
    searchMutation.mutate(values);
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page ima-knowledge-page">
      <PageHeader
        eyebrow="KNOWLEDGE IMA"
        title="知识库 IMA"
        description="管理 IMA 知识库连接，为需求洞察、案例检索和方案生成提供稳定的知识增强能力。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => configsQuery.refetch()}>刷新</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增连接</Button>
        ]}
      />

      <StatGrid items={stats} />

      {configsQuery.isLoading && <Skeleton active paragraph={{ rows: 9 }} />}

      {configsQuery.isError && (
        <Result
          status="error"
          title="IMA 连接加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && (
        <div className="ima-workbench-grid">
          <Card
            className="gis-table-card ima-config-table-card"
            title={
              <Space>
                <ApiOutlined />
                <span>知识库连接</span>
              </Space>
            }
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建</Button>}
          >
            {configs.length === 0 ? (
              <Empty description="还没有 IMA 知识库连接">
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建第一条连接</Button>
              </Empty>
            ) : (
              <Table<ImaConfig>
                rowKey="id"
                dataSource={configs}
                pagination={{ pageSize: 8 }}
                rowClassName={(record) => record.id === selectedConfig?.id ? 'is-selected-row' : ''}
                onRow={(record) => ({
                  onClick: () => setSelectedConfigId(record.id)
                })}
                columns={[
                  {
                    title: '名称',
                    dataIndex: 'name',
                    width: 170,
                    render: (value: string, record) => (
                      <Button type="link" className="gis-link-button" onClick={(event) => { event.stopPropagation(); setSelectedConfigId(record.id); }}>
                        {value}
                      </Button>
                    )
                  },
                  {
                    title: '知识库 ID / 名称',
                    width: 230,
                    render: (_, record) => (
                      <div className="ima-kb-cell">
                        <strong>{record.kbId || '-'}</strong>
                        <span>{record.kbName || '未填写知识库名称'}</span>
                      </div>
                    )
                  },
                  {
                    title: '类型',
                    dataIndex: 'kbType',
                    width: 120,
                    render: (value?: string) => <StatusPill tone="cyan">{kbTypeLabel[value || 'mine'] || value || '我的知识库'}</StatusPill>
                  },
                  {
                    title: '行业标签',
                    dataIndex: 'industryTag',
                    width: 150,
                    render: (value?: string) => value ? <Tag color="blue">{value}</Tag> : <Typography.Text type="secondary">未设置</Typography.Text>
                  },
                  {
                    title: '默认',
                    dataIndex: 'isDefault',
                    width: 88,
                    render: (value?: number) => value === 1 ? <Tag color="green">默认</Tag> : <Typography.Text type="secondary">—</Typography.Text>
                  },
                  {
                    title: '状态',
                    dataIndex: 'isActive',
                    width: 104,
                    render: (value?: number) => <StatusPill tone={value === 0 ? 'muted' : 'green'}>{value === 0 ? '停用' : '启用'}</StatusPill>
                  },
                  {
                    title: '密钥',
                    dataIndex: 'apiKeyMasked',
                    width: 118,
                    render: (value?: string) => <code className="ima-key-mask">{value || '未配置'}</code>
                  },
                  {
                    title: '操作',
                    width: 258,
                    render: (_, record) => (
                      <Space size={8} onClick={(event) => event.stopPropagation()}>
                        <Button onClick={() => testMutation.mutate(record.id)} loading={testMutation.isPending}>测试</Button>
                        <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
                        <Popconfirm title="确认删除这个 IMA 连接？" onConfirm={() => deleteMutation.mutate(record.id)}>
                          <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
              />
            )}
          </Card>

          <Card
            className="ima-search-panel"
            title={
              <Space>
                <SearchOutlined />
                <span>检索 / 测试面板</span>
              </Space>
            }
          >
            <Space direction="vertical" size={14} className="ima-search-stack">
              <Alert
                type="info"
                showIcon
                message="真实参数检索"
                description="检索请求固定走 POST /api/ima/search，仅提交 kbIds 与 query；不会把 API Key 或掩码带入检索请求。"
              />

              <Form
                form={searchForm}
                layout="vertical"
                onFinish={runSearch}
                initialValues={{ kbIds: selectedConfig?.kbId ? [selectedConfig.kbId] : [] }}
              >
                <Form.Item name="kbIds" label="知识库">
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="选择一个或多个知识库"
                    options={configs.filter((item) => !!item.kbId).map((item) => ({
                      label: `${item.kbName || item.name}${item.kbId ? `（${item.kbId}）` : ''}`,
                      value: item.kbId as string
                    }))}
                  />
                </Form.Item>
                <Form.Item name="query" label="检索问题" rules={[{ required: true, message: '请输入检索关键词' }]}>
                  <Input.TextArea rows={4} placeholder="例如：智慧园区三维可视化平台建设方案有哪些关键能力？" />
                </Form.Item>
                <Space wrap>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={searchMutation.isPending}>开始检索</Button>
                  <Button
                    onClick={() => {
                      const kbIds = selectedConfig?.kbId ? [selectedConfig.kbId] : [];
                      searchForm.setFieldsValue({ kbIds });
                    }}
                  >
                    使用选中连接
                  </Button>
                </Space>
              </Form>

              {searchMutation.isPending && <Skeleton active paragraph={{ rows: 4 }} />}

              {searchResult && (
                <section className="ima-search-result">
                  <div className="ima-search-result__header">
                    <div>
                      <Typography.Text className="gis-section-kicker">SEARCH RESULT</Typography.Text>
                      <Typography.Title level={5}>“{searchResult.query}”</Typography.Title>
                    </div>
                    <StatusPill tone="cyan">{searchResult.totalFound} 条结果</StatusPill>
                  </div>
                  {searchResult.items.length === 0 ? (
                    <Empty description="未检索到匹配内容，请调整关键词或知识库范围。" />
                  ) : (
                    <div className="ima-result-list">
                      {searchResult.items.map((item: ImaSearchItem) => (
                        <article key={item.id} className="ima-result-item">
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.kbName || '未知知识库'} · {item.kbId || '-'}</span>
                          </div>
                          <Space size={6}>
                            <Tag>{item.type || 'DOC'}</Tag>
                            <Tag color="green">{formatScore(item.score)}</Tag>
                          </Space>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </Space>
          </Card>
        </div>
      )}

      <Modal
        title={editing ? '编辑 IMA 连接' : '新建 IMA 连接'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} onFinish={(values) => saveMutation.mutate(values)}>
          {editing && (
            <Alert
              type="warning"
              showIcon
              className="ima-secret-alert"
              message="密钥保护"
              description={`当前密钥只展示为 ${editing.apiKeyMasked || '******'}。编辑时 API Key 留空表示不更新，页面不会回填或提交掩码。`}
            />
          )}
          <Form.Item name="name" label="连接名称" rules={[{ required: true, message: '请输入连接名称' }]}>
            <Input placeholder="例如：GIS 方案知识库" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editing ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editing ? '留空表示保留原密钥；只有输入新值时才提交 apiKey。' : '新增连接时 API Key 必填。'}
          >
            <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="ima-sk-xxx" autoComplete="new-password" />
          </Form.Item>
          <div className="ima-form-grid">
            <Form.Item name="kbId" label="知识库 ID">
              <Input placeholder="kb-001" />
            </Form.Item>
            <Form.Item name="kbName" label="知识库名称">
              <Input placeholder="GIS 方案知识库" />
            </Form.Item>
            <Form.Item name="kbType" label="知识库类型">
              <Select options={kbTypeOptions} />
            </Form.Item>
            <Form.Item name="industryTag" label="行业标签">
              <Input placeholder="智慧城市 / 自然资源 / 水利环保" />
            </Form.Item>
          </div>
          <div className="ima-switch-row">
            <Form.Item name="isDefault" label="默认连接" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item name="isActive" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Space>
  );
}
