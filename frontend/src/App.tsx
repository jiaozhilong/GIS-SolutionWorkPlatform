import {
  ApiOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Result,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { useState } from 'react';
import { getHello } from './api/hello';
import { createProject, deleteProject, listProjects, type Project, type ProjectPayload, updateProject } from './api/projects';
import ImaConfigPage from './pages/Settings/ImaConfig';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

const menuItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: '仪表盘' },
  { key: 'projects', icon: <ProjectOutlined />, label: '项目管理' },
  { key: 'skills', icon: <ApiOutlined />, label: '技能管理' },
  { key: 'flows', icon: <NodeIndexOutlined />, label: '流程编排' },
  { key: 'templates', icon: <FileTextOutlined />, label: '模板管理' },
  { key: 'knowledge', icon: <DatabaseOutlined />, label: '知识配置' },
  { key: 'settings', icon: <SettingOutlined />, label: '系统设置' }
];

const statusOptions = [
  { label: '商机', value: 'OPPORTUNITY' },
  { label: '需求分析', value: 'ANALYSIS' },
  { label: '方案编制', value: 'PROPOSAL' },
  { label: '投标', value: 'BIDDING' },
  { label: '已签约', value: 'SIGNED' },
  { label: '交付中', value: 'DELIVERY' },
  { label: '已关闭', value: 'CLOSED' }
];

const priorityOptions = ['P0', 'P1', 'P2', 'P3'].map((value) => ({ label: value, value }));

function App() {
  const [activeKey, setActiveKey] = useState('projects');

  return (
    <Layout className="app-shell">
      <Sider width={240}>
        <div className="brand">GIS AI Platform</div>
        <Menu theme="dark" mode="inline" selectedKeys={[activeKey]} items={menuItems} onClick={({ key }) => setActiveKey(key)} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text strong>GIS 解决方案 AI 工作平台</Typography.Text>
          <Typography.Text type="secondary">本地开发环境</Typography.Text>
        </Header>
        <Content className="app-content">
          {activeKey === 'dashboard' && <Dashboard />}
          {activeKey === 'projects' && <ProjectManager />}
          {activeKey === 'knowledge' && <ImaConfigPage />}
          {activeKey !== 'dashboard' && activeKey !== 'projects' && activeKey !== 'knowledge' && <ComingSoon activeKey={activeKey} />}
        </Content>
      </Layout>
    </Layout>
  );
}

function Dashboard() {
  const helloQuery = useQuery({
    queryKey: ['hello'],
    queryFn: getHello,
    retry: 1
  });

  return (
    <Space direction="vertical" size={16} className="content-stack">
      <div>
        <Typography.Title level={3}>平台状态</Typography.Title>
        <Typography.Text type="secondary">当前已完成后端、数据库和项目管理的最小可用闭环。</Typography.Text>
      </div>
      <Card title="后端连接状态">
        {helloQuery.isLoading && <Skeleton active paragraph={{ rows: 2 }} />}
        {helloQuery.isError && (
          <Result
            status="error"
            title="后端接口暂不可用"
            subTitle="请确认 Spring Boot 服务已启动在 http://localhost:8080"
            extra={<Button onClick={() => helloQuery.refetch()}>重试</Button>}
          />
        )}
        {helloQuery.isSuccess && <Alert type="success" showIcon message="接口调用成功" description={`/api/hello 返回：${helloQuery.data}`} />}
      </Card>
    </Space>
  );
}

function ProjectManager() {
  const [form] = Form.useForm<ProjectPayload>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectPayload) => (editing ? updateProject(editing.id, payload) : createProject(payload)),
    onSuccess: () => {
      message.success(editing ? '项目已更新' : '项目已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      message.success('项目已删除');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'OPPORTUNITY', priority: 'P2' });
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    form.setFieldsValue(project);
    setModalOpen(true);
  };

  return (
    <Space direction="vertical" size={16} className="content-stack">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>项目管理</Typography.Title>
          <Typography.Text type="secondary">真实读写 PostgreSQL 的 GIS 项目台账。</Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => projectsQuery.refetch()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建项目
          </Button>
        </Space>
      </div>

      {projectsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

      {projectsQuery.isError && (
        <Result
          status="error"
          title="项目列表加载失败"
          subTitle={(projectsQuery.error as Error).message}
          extra={<Button onClick={() => projectsQuery.refetch()}>重试</Button>}
        />
      )}

      {projectsQuery.isSuccess && projectsQuery.data.length === 0 && (
        <Card>
          <Empty description="还没有 GIS 项目">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              创建第一个项目
            </Button>
          </Empty>
        </Card>
      )}

      {projectsQuery.isSuccess && projectsQuery.data.length > 0 && (
        <Card>
          <Table<Project>
            rowKey="id"
            dataSource={projectsQuery.data}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: '项目名称',
                dataIndex: 'name',
                render: (name, record) => <Button type="link" onClick={() => setSelected(record)}>{name}</Button>
              },
              { title: '客户', dataIndex: 'customerName' },
              { title: '行业', dataIndex: 'industry' },
              { title: 'GIS 领域', dataIndex: 'gisDomain' },
              { title: '阶段', dataIndex: 'status', render: (value) => <Tag color="blue">{value || 'OPPORTUNITY'}</Tag> },
              { title: '优先级', dataIndex: 'priority', render: (value) => <Tag color={value === 'P0' ? 'red' : 'default'}>{value || 'P2'}</Tag> },
              {
                title: '操作',
                width: 170,
                render: (_, record) => (
                  <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm title="确认删除这个项目？" onConfirm={() => deleteMutation.mutate(record.id)}>
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
        title={editing ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)} preserve={false}>
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="例如：某市自然资源一张图平台" />
          </Form.Item>
          <Form.Item name="customerName" label="客户名称">
            <Input placeholder="例如：某市自然资源局" />
          </Form.Item>
          <Form.Item name="industry" label="行业">
            <Input placeholder="例如：自然资源、智慧城市、水利环保" />
          </Form.Item>
          <Form.Item name="gisDomain" label="GIS 领域">
            <Input placeholder="例如：时空大数据、CIM、遥感监测" />
          </Form.Item>
          <Space size={16} className="form-row">
            <Form.Item name="status" label="阶段" className="form-item-half">
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="priority" label="优先级" className="form-item-half">
              <Select options={priorityOptions} />
            </Form.Item>
          </Space>
          <Form.Item name="githubRepoUrl" label="GitHub 仓库">
            <Input placeholder="https://github.com/owner/repo" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={4} placeholder="补充客户背景、原始需求、已有系统等信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="项目详情" width={560} open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="项目名称">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{selected.customerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="行业">{selected.industry || '-'}</Descriptions.Item>
            <Descriptions.Item label="GIS 领域">{selected.gisDomain || '-'}</Descriptions.Item>
            <Descriptions.Item label="阶段">{selected.status || 'OPPORTUNITY'}</Descriptions.Item>
            <Descriptions.Item label="优先级">{selected.priority || 'P2'}</Descriptions.Item>
            <Descriptions.Item label="GitHub 仓库">{selected.githubRepoUrl || '-'}</Descriptions.Item>
            <Descriptions.Item label="项目描述">{selected.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{selected.createdAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{selected.updatedAt || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Space>
  );
}

function ComingSoon({ activeKey }: { activeKey: string }) {
  const label = menuItems.find((item) => item.key === activeKey)?.label;
  return (
    <Card>
      <Result status="info" title={`${label} 正在开发`} subTitle="当前先打通项目管理闭环，后续模块会按 TODO 顺序继续接入真实后端接口。" />
    </Card>
  );
}

export default App;
