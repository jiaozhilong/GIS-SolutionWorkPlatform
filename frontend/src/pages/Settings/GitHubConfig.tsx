import {
  ApiOutlined,
  BranchesOutlined,
  DeleteOutlined,
  EditOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  GithubOutlined,
  PlusOutlined,
  ReloadOutlined
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
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  createGitHubConfig,
  deleteGitHubConfig,
  listGitHubConfigs,
  readGitHubFile,
  readGitHubReadme,
  readGitHubTree,
  testGitHubConfig,
  updateGitHubConfig,
  type GitHubConfig,
  type GitHubConfigPayload,
  type GitHubFileContent,
  type GitHubTestResult,
  type GitHubTreeItem
} from '../../api/github';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

type GitHubFormValues = Omit<GitHubConfigPayload, 'isActive'> & {
  isActive?: boolean;
};

type RepoReadFormValues = {
  owner: string;
  repo: string;
};

function toFlag(value?: boolean | number) {
  return value ? 1 : 0;
}

function compactPayload(values: GitHubFormValues, editing: boolean): GitHubConfigPayload {
  const payload: GitHubConfigPayload = {
    name: values.name.trim(),
    username: values.username?.trim() || undefined,
    defaultOrg: values.defaultOrg?.trim() || undefined,
    isActive: toFlag(values.isActive)
  };

  const token = values.token?.trim();
  if (token) {
    payload.token = token;
  } else if (!editing) {
    payload.token = '';
  }

  return payload;
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function latestCreatedAt(configs: GitHubConfig[]) {
  const sorted = configs
    .map((item) => item.createdAt)
    .filter(Boolean)
    .sort();
  const latest = sorted[sorted.length - 1];
  return latest ? formatDate(latest) : '暂无';
}

function isReadableFile(item: GitHubTreeItem) {
  return item.type !== 'tree' && /\.(md|markdown|txt|json|yml|yaml|ts|tsx|js|jsx|java|xml|sql|css|html)$/i.test(item.path);
}

function fileIcon(item: GitHubTreeItem) {
  if (item.type === 'tree') return <FolderOpenOutlined />;
  if (/\.md$/i.test(item.path)) return <FileMarkdownOutlined />;
  return <FileTextOutlined />;
}

export default function GitHubConfigPage() {
  const [form] = Form.useForm<GitHubFormValues>();
  const [repoForm] = Form.useForm<RepoReadFormValues>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GitHubConfig | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>();
  const [testResult, setTestResult] = useState<GitHubTestResult | null>(null);
  const [repoContext, setRepoContext] = useState<RepoReadFormValues>({ owner: 'octocat', repo: 'Spoon-Knife' });
  const [selectedPath, setSelectedPath] = useState<string>('README.md');
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('README.md');

  const configsQuery = useQuery({
    queryKey: ['github-configs'],
    queryFn: listGitHubConfigs
  });

  const configs = configsQuery.data || [];
  const selectedConfig = configs.find((item) => item.id === selectedConfigId) || configs.find((item) => item.isActive !== 0) || configs[0];

  const stats = useMemo(() => [
    { label: '连接总数', value: configs.length, helper: 'GitHub 资产入口', tone: 'cyan' as const },
    { label: '启用连接', value: configs.filter((item) => item.isActive !== 0).length, helper: '可用于读取仓库', tone: 'green' as const },
    { label: '组织数', value: new Set(configs.map((item) => item.defaultOrg).filter(Boolean)).size, helper: '默认 Owner / Org', tone: 'blue' as const },
    { label: '最近配置时间', value: latestCreatedAt(configs), helper: '按创建时间统计', tone: 'amber' as const }
  ], [configs]);

  const saveMutation = useMutation({
    mutationFn: (values: GitHubFormValues) => {
      const payload = compactPayload(values, !!editing);
      return editing ? updateGitHubConfig(editing.id, payload) : createGitHubConfig(payload);
    },
    onSuccess: (config) => {
      message.success(editing ? 'GitHub 连接已更新' : 'GitHub 连接已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setSelectedConfigId(config.id);
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGitHubConfig,
    onSuccess: () => {
      message.success('GitHub 连接已删除');
      queryClient.invalidateQueries({ queryKey: ['github-configs'] });
    },
    onError: (error) => message.error((error as Error).message)
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
    },
    onError: (error) => message.error((error as Error).message)
  });

  const treeMutation = useMutation({
    mutationFn: ({ owner, repo }: RepoReadFormValues) => readGitHubTree(owner.trim(), repo.trim()),
    onError: (error) => message.error((error as Error).message)
  });

  const readmeMutation = useMutation({
    mutationFn: ({ owner, repo }: RepoReadFormValues) => readGitHubReadme(owner.trim(), repo.trim()),
    onSuccess: (content, values) => {
      setRepoContext(values);
      setSelectedPath('README.md');
      setPreviewTitle('README.md');
      setPreviewContent(content);
      message.success('README 读取成功');
    },
    onError: (error) => message.error((error as Error).message)
  });

  const fileMutation = useMutation({
    mutationFn: ({ owner, repo, path }: RepoReadFormValues & { path: string }) => readGitHubFile(owner.trim(), repo.trim(), path),
    onSuccess: (file: GitHubFileContent) => {
      setSelectedPath(file.path);
      setPreviewTitle(file.path || file.name);
      setPreviewContent(file.content || '');
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    setEditing(null);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (config: GitHubConfig) => {
    setEditing(config);
    setTestResult(null);
    form.resetFields();
    form.setFieldsValue({
      name: config.name,
      token: undefined,
      username: config.username,
      defaultOrg: config.defaultOrg,
      isActive: config.isActive !== 0
    });
    setModalOpen(true);
  };

  const loadRepo = (values: RepoReadFormValues) => {
    const normalized = { owner: values.owner.trim(), repo: values.repo.trim() };
    setRepoContext(normalized);
    setPreviewContent('');
    setPreviewTitle('README.md');
    setSelectedPath('README.md');
    treeMutation.mutate(normalized);
    readmeMutation.mutate(normalized);
  };

  const openRepoFromConfig = (config?: GitHubConfig) => {
    const owner = config?.defaultOrg || config?.username || repoContext.owner;
    repoForm.setFieldsValue({ owner, repo: repoContext.repo });
    setSelectedConfigId(config?.id || selectedConfigId);
  };

  const readFile = (item: GitHubTreeItem) => {
    if (!isReadableFile(item)) {
      message.info('目录或二进制文件暂不预览，请选择 Markdown、文本或源码文件');
      return;
    }
    fileMutation.mutate({ ...repoContext, path: item.path });
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page github-connector-page">
      <PageHeader
        eyebrow="GITHUB CONNECTOR"
        title="GitHub 连接"
        description="连接 GitHub 代码与文档资产，读取 README、文件树和仓库文件，为方案生成提供项目背景与技术上下文。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => configsQuery.refetch()}>刷新</Button>,
          <Button key="readme" icon={<FileMarkdownOutlined />} onClick={() => openRepoFromConfig(selectedConfig)}>README 预览</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增连接</Button>
        ]}
      />

      <StatGrid items={stats} />

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
          title="GitHub 连接加载失败"
          subTitle={(configsQuery.error as Error).message}
          extra={<Button onClick={() => configsQuery.refetch()}>重试</Button>}
        />
      )}

      {configsQuery.isSuccess && (
        <Card
          className="gis-table-card github-table-card"
          title={
            <Space>
              <GithubOutlined />
              <span>连接配置</span>
            </Space>
          }
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建连接</Button>}
        >
          {configs.length === 0 ? (
            <Empty description="还没有 GitHub 连接">
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建第一条连接</Button>
            </Empty>
          ) : (
            <Table<GitHubConfig>
              rowKey="id"
              dataSource={configs}
              pagination={{ pageSize: 8 }}
              rowClassName={(record) => record.id === selectedConfig?.id ? 'is-selected-row' : ''}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedConfigId(record.id);
                  openRepoFromConfig(record);
                }
              })}
              columns={[
                {
                  title: '配置名',
                  dataIndex: 'name',
                  width: 190,
                  render: (value: string, record) => (
                    <Button type="link" className="gis-link-button" onClick={(event) => { event.stopPropagation(); setSelectedConfigId(record.id); }}>
                      {value}
                    </Button>
                  )
                },
                { title: 'GitHub 用户', dataIndex: 'username', width: 160, render: (value?: string) => value || <Typography.Text type="secondary">未填写</Typography.Text> },
                { title: '默认组织', dataIndex: 'defaultOrg', width: 170, render: (value?: string) => value || <Typography.Text type="secondary">未设置</Typography.Text> },
                {
                  title: 'Token 掩码',
                  dataIndex: 'tokenMasked',
                  width: 120,
                  render: (value?: string) => <code className="github-token-mask">{value || '未配置'}</code>
                },
                {
                  title: '状态',
                  dataIndex: 'isActive',
                  width: 104,
                  render: (value?: number) => <StatusPill tone={value === 0 ? 'muted' : 'green'}>{value === 0 ? '停用' : '启用'}</StatusPill>
                },
                { title: '创建时间', dataIndex: 'createdAt', width: 170, render: formatDate },
                {
                  title: '操作',
                  width: 302,
                  render: (_, record) => (
                    <Space size={8} onClick={(event) => event.stopPropagation()}>
                      <Button onClick={() => testMutation.mutate(record.id)} loading={testMutation.isPending}>测试</Button>
                      <Button icon={<FileMarkdownOutlined />} onClick={() => openRepoFromConfig(record)}>README</Button>
                      <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
                      <Popconfirm title="确认删除这个 GitHub 连接？" onConfirm={() => deleteMutation.mutate(record.id)}>
                        <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          )}
        </Card>
      )}

      <Card
        className="github-repo-preview-card"
        title={
          <Space>
            <BranchesOutlined />
            <span>README 预览 / 文件树</span>
          </Space>
        }
      >
        <Space direction="vertical" size={14} className="github-preview-stack">
          <Alert
            type="info"
            showIcon
            message="仓库读取不会写入配置"
            description="Owner、Repo 和文件 path 只用于读取 README、Tree 和 File，不会提交到 GitHub 配置接口。Markdown 使用 React 渲染，默认不会执行危险 HTML。"
          />
          <Form
            form={repoForm}
            layout="inline"
            initialValues={repoContext}
            onFinish={loadRepo}
            className="github-repo-form"
          >
            <Form.Item name="owner" label="Owner" rules={[{ required: true, message: '请输入 Owner' }]}>
              <Input placeholder="octocat / openai" />
            </Form.Item>
            <Form.Item name="repo" label="Repo" rules={[{ required: true, message: '请输入 Repo' }]}>
              <Input placeholder="Spoon-Knife" />
            </Form.Item>
            <Form.Item className="github-repo-actions">
              <Space>
                <Button type="primary" htmlType="submit" icon={<FileMarkdownOutlined />} loading={readmeMutation.isPending || treeMutation.isPending}>读取 README</Button>
                <Button onClick={() => selectedConfig && openRepoFromConfig(selectedConfig)}>使用选中连接</Button>
              </Space>
            </Form.Item>
          </Form>

          <div className="github-preview-grid">
            <section className="github-tree-panel">
              <div className="github-preview-panel-title">
                <strong>文件树</strong>
                <span>{treeMutation.data?.length || 0} 项</span>
              </div>
              {treeMutation.isError && <Alert type="error" showIcon message={(treeMutation.error as Error).message} />}
              {treeMutation.isPending && <Skeleton active paragraph={{ rows: 10 }} />}
              {!treeMutation.isPending && !treeMutation.data?.length && <Empty description="读取仓库后显示文件树" />}
              {!!treeMutation.data?.length && (
                <div className="github-file-list">
                  {treeMutation.data.map((item: GitHubTreeItem) => (
                    <button
                      key={`${item.type}-${item.path}`}
                      type="button"
                      className={`github-file-item ${item.path === selectedPath ? 'is-active' : ''}`}
                      onClick={() => readFile(item)}
                    >
                      <span>{fileIcon(item)}</span>
                      <strong>{item.path}</strong>
                      <small>{item.type === 'tree' ? '目录' : item.size ? `${item.size} B` : '文件'}</small>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="github-markdown-panel">
              <div className="github-preview-panel-title">
                <strong>{previewTitle}</strong>
                <span>{repoContext.owner}/{repoContext.repo}</span>
              </div>
              {readmeMutation.isError && <Alert type="error" showIcon message={(readmeMutation.error as Error).message} />}
              {fileMutation.isError && <Alert type="error" showIcon message={(fileMutation.error as Error).message} />}
              {(readmeMutation.isPending || fileMutation.isPending) && <Skeleton active paragraph={{ rows: 10 }} />}
              {!readmeMutation.isPending && !fileMutation.isPending && !previewContent && <Empty description="读取 README 或选择文件后显示内容预览" />}
              {!!previewContent && (
                <div className="github-markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
                </div>
              )}
            </section>
          </div>
        </Space>
      </Card>

      <Modal
        title={editing ? '编辑 GitHub 连接' : '新建 GitHub 连接'}
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
              className="github-secret-alert"
              message="Token 保护"
              description={`当前 Token 只展示为 ${editing.tokenMasked || '******'}。编辑时 Token 留空表示不更新，页面不会回填或提交掩码。`}
            />
          )}
          <Form.Item name="name" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
            <Input placeholder="例如：公司 GitHub" />
          </Form.Item>
          <Form.Item
            name="token"
            label="GitHub Token"
            rules={editing ? [] : [{ required: true, message: '请输入 GitHub Token' }]}
            extra={editing ? '留空表示保留原 Token；只有输入新值时才提交 token。' : '新增连接时 Token 必填。'}
          >
            <Input.Password placeholder="github_pat_xxx / ghp_xxx" autoComplete="new-password" />
          </Form.Item>
          <div className="github-form-grid">
            <Form.Item name="username" label="GitHub 用户">
              <Input placeholder="GitHub 登录名" />
            </Form.Item>
            <Form.Item name="defaultOrg" label="默认组织 / Owner">
              <Input placeholder="例如：openai" />
            </Form.Item>
          </div>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
