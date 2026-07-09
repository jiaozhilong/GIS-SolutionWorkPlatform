import { DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, Modal, Popconfirm, Result, Skeleton, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import {
  createGitHubConfig,
  deleteGitHubConfig,
  listGitHubConfigs,
  readGitHubReadme,
  testGitHubConfig,
  type GitHubConfig,
  type GitHubConfigPayload,
  type GitHubTestResult,
  updateGitHubConfig
} from '../../api/github';

export default function GitHubConfigPage() {
  const [form] = Form.useForm<GitHubConfigPayload>();
  const [readmeForm] = Form.useForm<{ owner: string; repo: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GitHubConfig | null>(null);
  const [testResult, setTestResult] = useState<GitHubTestResult | null>(null);
  const [readmeOpen, setReadmeOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');

  const configsQuery = useQuery({
    queryKey: ['github-configs'],
    queryFn: listGitHubConfigs
  });

  const saveMutation = useMutation({
    mutationFn: (payload: GitHubConfigPayload) => (editing ? updateGitHubConfig(editing.id, payload) : createGitHubConfig(payload)),
    onSuccess: () => {
      message.success(editing ? 'GitHub 配置已更新' : 'GitHub 配置已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGitHubConfig,
    onSuccess: () => {
      message.success('GitHub 配置已删除');
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    }
  });

  const testMutation = useMutation({
    mutationFn: testGitHubConfig,
    onSuccess: (result) => {
      setTestResult(result);
      if (result.connected) {
        message.success(`连接成功，延迟 ${result.latencyMs} ms`);
      } else {
        message.warning(result.message || '连接测试未通过，请检查 Token 权限');
      }
    }
  });

  const readmeMutation = useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => readGitHubReadme(owner, repo),
    onSuccess: (content) => {
      setReadmeContent(content);
      message.success('README 读取成功');
    }
  });

  const openCreate = () => {
    setEditing(null);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({ isActive: 1 });
    setModalOpen(true);
  };

  const openEdit = (config: GitHubConfig) => {
    setEditing(config);
    setTestResult(null);
    form.setFieldsValue({
      name: config.name,
      username: config.username,
      defaultOrg: config.defaultOrg,
      isActive: config.isActive
    });
    setModalOpen(true);
  };

  const openReadme = (config?: GitHubConfig) => {
    setReadmeContent('');
    readmeForm.setFieldsValue({ owner: config?.defaultOrg || 'octocat', repo: config?.defaultOrg ? '' : 'Spoon-Knife' });
    setReadmeOpen(true);
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Text className="gis-section-kicker">GITHUB CONNECTOR</Typography.Text>
          <Typography.Title level={3}>GitHub 配置</Typography.Title>
          <Typography.Text type="secondary">配置 GitHub Token，用于读取项目仓库 README、目录树和源文件。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => configsQuery.refetch()}>
            刷新
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => openReadme()}>
            读取公开 README
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建配置
          </Button>
        </Space>
      </div>

      {testResult && (
        <Alert
          type={testResult.connected ? 'success' : 'warning'}
          showIcon
          message={testResult.connected ? 'GitHub 连接成功' : 'GitHub 连接未通过'}
          description={`${testResult.message || ''}${testResult.login ? `，账号：${testResult.login}` : ''}${typeof testResult.rateLimitRemaining === 'number' ? `，剩余限额：${testResult.rateLimitRemaining}` : ''}`}
        />
      )}

      {configsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

      {configsQuery.isError && (
        <Result
          status="error"
          title="GitHub 配置加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && configsQuery.data.length === 0 && (
        <Card className="gis-glass-card">
          <Empty description="还没有 GitHub 配置">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建第一条配置
            </Button>
          </Empty>
        </Card>
      )}

      {configsQuery.isSuccess && configsQuery.data.length > 0 && (
        <Card className="gis-glass-card gis-table-card">
          <Table<GitHubConfig>
            rowKey="id"
            dataSource={configsQuery.data}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '配置名称', dataIndex: 'name' },
              { title: '用户名', dataIndex: 'username' },
              { title: '默认组织/Owner', dataIndex: 'defaultOrg' },
              { title: 'Token', dataIndex: 'tokenMasked', width: 110 },
              { title: '状态', dataIndex: 'isActive', width: 90, render: (value) => <Tag color={value === 1 ? 'green' : 'default'}>{value === 1 ? '启用' : '停用'}</Tag> },
              {
                title: '操作',
                width: 320,
                render: (_, record) => (
                  <Space>
                    <Button onClick={() => testMutation.mutate(record.id)} loading={testMutation.isPending}>
                      测试连接
                    </Button>
                    <Button icon={<FileTextOutlined />} onClick={() => openReadme(record)}>
                      README
                    </Button>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm title="确认删除这个 GitHub 配置？" onConfirm={() => deleteMutation.mutate(record.id)}>
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
        title={editing ? '编辑 GitHub 配置' : '新建 GitHub 配置'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="例如：公司 GitHub" />
          </Form.Item>
          <Form.Item name="token" label="GitHub Token" rules={editing ? [] : [{ required: true, message: '请输入 GitHub Token' }]} extra={editing ? '不填写则保留原 Token' : undefined}>
            <Input.Password placeholder="github_pat_xxx / ghp_xxx" />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input placeholder="GitHub 登录名" />
          </Form.Item>
          <Form.Item name="defaultOrg" label="默认组织/Owner">
            <Input placeholder="例如：jiaozhilong" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="读取仓库 README" open={readmeOpen} onCancel={() => setReadmeOpen(false)} footer={null} width={820} destroyOnClose>
        <Form form={readmeForm} layout="inline" onFinish={(values) => readmeMutation.mutate(values)}>
          <Form.Item name="owner" rules={[{ required: true, message: '请输入 owner' }]}>
            <Input placeholder="owner，例如 octocat" />
          </Form.Item>
          <Form.Item name="repo" rules={[{ required: true, message: '请输入 repo' }]}>
            <Input placeholder="repo，例如 Spoon-Knife" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={readmeMutation.isPending}>
              读取
            </Button>
          </Form.Item>
        </Form>
        {readmeMutation.isError && <Alert className="search-result-card" type="error" showIcon message={(readmeMutation.error as Error).message} />}
        {readmeContent && (
          <Card className="search-result-card gis-glass-card" title={`README 预览（${readmeContent.length} 字符）`}>
            <pre className="github-readme-preview">{readmeContent}</pre>
          </Card>
        )}
      </Modal>
    </Space>
  );
}
