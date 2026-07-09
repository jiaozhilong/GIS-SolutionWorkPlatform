import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, InputNumber, Modal, Popconfirm, Result, Select, Skeleton, Slider, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import {
  createLlmConfig,
  deleteLlmConfig,
  listLlmConfigs,
  testLlmConfig,
  type LlmConfig,
  type LlmConfigPayload,
  type LlmTestResult,
  updateLlmConfig
} from '../../api/llm';

const usageSceneOptions = [
  { label: '分析', value: 'analysis' },
  { label: '生成', value: 'generation' },
  { label: '总结', value: 'summary' }
];

export default function LlmConfigPage() {
  const [form] = Form.useForm<LlmConfigPayload>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LlmConfig | null>(null);
  const [testResult, setTestResult] = useState<LlmTestResult | null>(null);

  const configsQuery = useQuery({
    queryKey: ['llm-configs'],
    queryFn: listLlmConfigs
  });

  const saveMutation = useMutation({
    mutationFn: (payload: LlmConfigPayload) => (editing ? updateLlmConfig(editing.id, payload) : createLlmConfig(payload)),
    onSuccess: () => {
      message.success(editing ? '大模型配置已更新' : '大模型配置已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLlmConfig,
    onSuccess: () => {
      message.success('大模型配置已删除');
      queryClient.invalidateQueries({ queryKey: ['llm-configs'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: testLlmConfig,
    onSuccess: (result) => {
      setTestResult(result);
      if (result.connected) {
        message.success(`连接成功，延迟 ${result.latencyMs} ms`);
      } else {
        message.warning('连接测试未通过，请检查 API Key、API Base 和模型名称');
      }
    }
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
      isActive: 1
    });
    setModalOpen(true);
  };

  const openEdit = (config: LlmConfig) => {
    setEditing(config);
    setTestResult(null);
    form.setFieldsValue({
      name: config.name,
      apiBase: config.apiBase,
      modelName: config.modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      systemPrompt: config.systemPrompt,
      timeoutSeconds: config.timeoutSeconds,
      usageScene: config.usageScene,
      isActive: config.isActive
    });
    setModalOpen(true);
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>大模型配置</Typography.Title>
          <Typography.Text type="secondary">配置 OpenAI-compatible Chat Completions 模型，测试连接会真实请求模型接口。</Typography.Text>
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
          title="大模型配置加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && configsQuery.data.length === 0 && (
        <Card className="gis-glass-card">
          <Empty description="还没有大模型配置">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建第一条配置
            </Button>
          </Empty>
        </Card>
      )}

      {configsQuery.isSuccess && configsQuery.data.length > 0 && (
        <Card className="gis-glass-card">
          <Table<LlmConfig>
            rowKey="id"
            dataSource={configsQuery.data}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '配置名称', dataIndex: 'name' },
              { title: 'API Base', dataIndex: 'apiBase' },
              { title: '模型', dataIndex: 'modelName' },
              { title: '温度', dataIndex: 'temperature', width: 90 },
              { title: '最大 Token', dataIndex: 'maxTokens', width: 120 },
              { title: '场景', dataIndex: 'usageScene', render: (value) => <Tag color="blue">{value || 'generation'}</Tag> },
              { title: 'API Key', dataIndex: 'apiKeyMasked', width: 110 },
              {
                title: '操作',
                width: 230,
                render: (_, record) => (
                  <Space>
                    <Button onClick={() => testMutation.mutate(record.id)} loading={testMutation.isPending}>
                      测试连接
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm title="确认删除这个大模型配置？" onConfirm={() => deleteMutation.mutate(record.id)}>
                      <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </Card>
      )}

      {testResult && (
        <Alert
          type={testResult.connected ? 'success' : 'warning'}
          showIcon
          message={testResult.connected ? '连接测试成功' : '连接测试未通过'}
          description={`${testResult.message || ''} 延迟：${testResult.latencyMs} ms${testResult.responsePreview ? `，响应：${testResult.responsePreview}` : ''}`}
        />
      )}

      <Modal
        title={editing ? '编辑大模型配置' : '新建大模型配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="例如：DeepSeek" />
          </Form.Item>
          <Form.Item name="apiBase" label="API Base" rules={[{ required: true, message: '请输入 API Base' }]}>
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={editing ? [] : [{ required: true, message: '请输入 API Key' }]}
            extra={editing ? '不填写则保留原 API Key' : undefined}
          >
            <Input.Password placeholder="sk-xxx" />
          </Form.Item>
          <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="deepseek-chat" />
          </Form.Item>
          <Form.Item name="temperature" label="温度">
            <Slider min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item name="maxTokens" label="最大 Token">
            <InputNumber min={1} max={128000} className="full-width" />
          </Form.Item>
          <Form.Item name="timeoutSeconds" label="超时时间（秒）">
            <InputNumber min={5} max={600} className="full-width" />
          </Form.Item>
          <Form.Item name="usageScene" label="使用场景">
            <Select options={usageSceneOptions} />
          </Form.Item>
          <Form.Item name="systemPrompt" label="默认 System Prompt">
            <Input.TextArea rows={3} placeholder="你是一个专业的 GIS 解决方案顾问。" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}


