import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Empty, Form, Input, Modal, Popconfirm, Result, Select, Skeleton, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import {
  createImaConfig,
  deleteImaConfig,
  listImaConfigs,
  searchIma,
  testImaConfig,
  type ImaConfig,
  type ImaConfigPayload,
  type ImaSearchResult,
  updateImaConfig
} from '../../api/ima';

const kbTypeOptions = [
  { label: '我的知识库', value: 'mine' },
  { label: '共享知识库', value: 'shared' },
  { label: '订阅知识库', value: 'subscribed' }
];

export default function ImaConfigPage() {
  const [form] = Form.useForm<ImaConfigPayload>();
  const [searchForm] = Form.useForm<{ query: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ImaConfig | null>(null);
  const [searchingConfig, setSearchingConfig] = useState<ImaConfig | null>(null);
  const [searchResult, setSearchResult] = useState<ImaSearchResult | null>(null);

  const configsQuery = useQuery({
    queryKey: ['ima-configs'],
    queryFn: listImaConfigs
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ImaConfigPayload) => (editing ? updateImaConfig(editing.id, payload) : createImaConfig(payload)),
    onSuccess: () => {
      message.success(editing ? 'IMA 配置已更新' : 'IMA 配置已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['ima-configs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteImaConfig,
    onSuccess: () => {
      message.success('IMA 配置已删除');
      queryClient.invalidateQueries({ queryKey: ['ima-configs'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: testImaConfig,
    onSuccess: () => message.success('连接测试成功')
  });

  const searchMutation = useMutation({
    mutationFn: ({ kbIds, query }: { kbIds: string[]; query: string }) => searchIma(kbIds, query),
    onSuccess: (result) => setSearchResult(result)
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ kbType: 'mine', isDefault: 0, isActive: 1 });
    setModalOpen(true);
  };

  const openEdit = (config: ImaConfig) => {
    setEditing(config);
    form.setFieldsValue({
      name: config.name,
      kbId: config.kbId,
      kbName: config.kbName,
      kbType: config.kbType || 'mine',
      industryTag: config.industryTag,
      isDefault: config.isDefault,
      isActive: config.isActive
    });
    setModalOpen(true);
  };

  const openSearch = (config: ImaConfig) => {
    setSearchingConfig(config);
    setSearchResult(null);
    searchForm.resetFields();
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>IMA 知识库配置</Typography.Title>
          <Typography.Text type="secondary">配置 GIS 行业知识库，当前检索使用 Mock 实现，后续替换为真实 IMA SDK。</Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => configsQuery.refetch()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建配置
          </Button>
        </Space>
      </div>

      {configsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

      {configsQuery.isError && (
        <Result
          status="error"
          title="IMA 配置加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && configsQuery.data.length === 0 && (
        <Card className="gis-glass-card">
          <Empty description="还没有 IMA 知识库配置">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建第一条配置
            </Button>
          </Empty>
        </Card>
      )}

      {configsQuery.isSuccess && configsQuery.data.length > 0 && (
        <Card className="gis-glass-card">
          <Table<ImaConfig>
            rowKey="id"
            dataSource={configsQuery.data}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '配置名称', dataIndex: 'name' },
              { title: '知识库 ID', dataIndex: 'kbId' },
              { title: '知识库名称', dataIndex: 'kbName' },
              { title: '类型', dataIndex: 'kbType', render: (value) => <Tag color="blue">{value || 'mine'}</Tag> },
              { title: '行业标签', dataIndex: 'industryTag' },
              { title: 'API Key', dataIndex: 'apiKeyMasked' },
              {
                title: '操作',
                width: 300,
                render: (_, record) => (
                  <Space>
                    <Button onClick={() => testMutation.mutate(record.id)} loading={testMutation.isPending}>
                      测试连接
                    </Button>
                    <Button icon={<SearchOutlined />} onClick={() => openSearch(record)}>
                      检索测试
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm title="确认删除这个 IMA 配置？" onConfirm={() => deleteMutation.mutate(record.id)}>
                      <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}

      <Modal
        title={editing ? '编辑 IMA 配置' : '新建 IMA 配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="例如：GIS 方案知识库" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editing ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editing ? '不填写则保留原 API Key' : undefined}
          >
            <Input.Password placeholder="ima-sk-xxx" />
          </Form.Item>
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
        </Form>
      </Modal>

      <Modal
        title={`检索测试${searchingConfig ? ` - ${searchingConfig.name}` : ''}`}
        open={!!searchingConfig}
        onCancel={() => setSearchingConfig(null)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={searchForm}
          layout="inline"
          onFinish={({ query }) => searchMutation.mutate({ kbIds: searchingConfig?.kbId ? [searchingConfig.kbId] : [], query })}
        >
          <Form.Item name="query" rules={[{ required: true, message: '请输入检索关键词' }]} className="search-input">
            <Input placeholder="例如：智慧城市时空大数据" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={searchMutation.isPending}>
              检索
            </Button>
          </Form.Item>
        </Form>

        {searchResult && (
          <Card className="search-result-card gis-glass-card" title={`共找到 ${searchResult.totalFound} 条结果`}>
            <Table
              rowKey="id"
              dataSource={searchResult.items}
              pagination={false}
              columns={[
                { title: '标题', dataIndex: 'title' },
                { title: '类型', dataIndex: 'type', width: 90 },
                { title: '得分', dataIndex: 'score', width: 90 },
                { title: '知识库', dataIndex: 'kbName' }
              ]}
            />
          </Card>
        )}
      </Modal>
    </Space>
  );
}

