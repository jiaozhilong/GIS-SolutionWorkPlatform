import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Descriptions, Drawer, Empty, Form, Input, Modal, Popconfirm, Result, Select, Skeleton, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { createProject, deleteProject, listProjects, type Project, type ProjectPayload, updateProject } from '../../api/projects';

const { TextArea } = Input;

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

const activeStatuses = new Set(['OPPORTUNITY', 'ANALYSIS', 'PROPOSAL', 'BIDDING', 'DELIVERY']);

function getStatusLabel(value?: string) {
  return statusOptions.find((item) => item.value === value)?.label || value || '商机';
}

function statusClass(value?: string) {
  if (value === 'SIGNED') return 'is-success';
  if (value === 'CLOSED') return 'is-muted';
  if (value === 'DELIVERY') return 'is-info';
  return 'is-active';
}

export default function ProjectManagerPage() {
  const [form] = Form.useForm<ProjectPayload>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects
  });

  const projects = projectsQuery.data || [];
  const stats = useMemo(() => {
    const active = projects.filter((item) => activeStatuses.has(item.status || 'OPPORTUNITY')).length;
    const signedOrDelivery = projects.filter((item) => item.status === 'SIGNED' || item.status === 'DELIVERY').length;
    const highPriority = projects.filter((item) => item.priority === 'P0' || item.priority === 'P1').length;
    return [
      { label: '项目总数', value: projects.length, tone: 'cyan' },
      { label: '推进中', value: active, tone: 'green' },
      { label: '签约/交付', value: signedOrDelivery, tone: 'blue' },
      { label: '高优先级', value: highPriority, tone: 'amber' }
    ];
  }, [projects]);

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
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Text className="gis-section-kicker">PROJECT LEDGER</Typography.Text>
          <Typography.Title level={3}>项目管理</Typography.Title>
          <Typography.Text type="secondary">真实读写 PostgreSQL 的 GIS 项目台账。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => projectsQuery.refetch()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建项目
          </Button>
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

      {projectsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}

      {projectsQuery.isError && (
        <Result
          status="error"
          title="项目列表加载失败"
          subTitle={(projectsQuery.error as Error).message}
          extra={<Button onClick={() => projectsQuery.refetch()}>重试</Button>}
        />
      )}

      {projectsQuery.isSuccess && projects.length === 0 && (
        <Card className="gis-glass-card">
          <Empty description="还没有 GIS 项目">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              创建第一个项目
            </Button>
          </Empty>
        </Card>
      )}

      {projectsQuery.isSuccess && projects.length > 0 && (
        <Card className="gis-glass-card gis-table-card">
          <Table<Project>
            rowKey="id"
            dataSource={projects}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: '项目名称',
                dataIndex: 'name',
                render: (name, record) => (
                  <Button type="link" className="gis-link-button" onClick={() => setSelected(record)}>
                    {name}
                  </Button>
                )
              },
              { title: '客户', dataIndex: 'customerName' },
              { title: '行业', dataIndex: 'industry' },
              { title: 'GIS 领域', dataIndex: 'gisDomain' },
              {
                title: '阶段',
                dataIndex: 'status',
                render: (value) => <span className={`gis-status-badge ${statusClass(value)}`}>{getStatusLabel(value)}</span>
              },
              {
                title: '优先级',
                dataIndex: 'priority',
                render: (value) => <Tag color={value === 'P0' ? 'red' : value === 'P1' ? 'orange' : 'cyan'}>{value || 'P2'}</Tag>
              },
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
            <Descriptions.Item label="阶段">{getStatusLabel(selected.status)}</Descriptions.Item>
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
