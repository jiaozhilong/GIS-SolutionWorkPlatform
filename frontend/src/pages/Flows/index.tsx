import { DeleteOutlined, EditOutlined, NodeIndexOutlined, PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Empty, Form, Input, Modal, Popconfirm, Result, Select, Skeleton, Space, Table, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { createFlow, deleteFlow, executeFlow, listFlows, updateFlow, type Flow, type FlowExecution, type FlowPayload } from '../../api/flows';
import { listSkills } from '../../api/skills';

const { TextArea } = Input;

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
];

const defaultInputJson = '{\n  "projectName": "Smart City Spatio-temporal Platform",\n  "industry": "Smart City",\n  "query": "spatio-temporal data"\n}';

export default function FlowManagerPage() {
  const [form] = Form.useForm<FlowPayload & { nodesJson: string; edgesJson: string }>();
  const [executeForm] = Form.useForm<{ inputJson: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [executing, setExecuting] = useState<Flow | null>(null);
  const [executionResult, setExecutionResult] = useState<FlowExecution | null>(null);

  const flowsQuery = useQuery({ queryKey: ['flows'], queryFn: listFlows });
  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: listSkills });
  const flows = flowsQuery.data || [];
  const skills = skillsQuery.data || [];

  const stats = useMemo(() => [
    { label: '流程总数', value: flows.length, tone: 'cyan' },
    { label: '启用', value: flows.filter((item) => item.status !== 'DISABLED').length, tone: 'green' },
    { label: '节点总数', value: flows.reduce((sum, item) => sum + (item.nodes?.length || 0), 0), tone: 'blue' },
    { label: '连线总数', value: flows.reduce((sum, item) => sum + (item.edges?.length || 0), 0), tone: 'amber' }
  ], [flows]);

  const saveMutation = useMutation({
    mutationFn: (payload: FlowPayload) => (editing ? updateFlow(editing.id, payload) : createFlow(payload)),
    onSuccess: () => {
      message.success(editing ? '流程已更新' : '流程已创建');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFlow,
    onSuccess: () => {
      message.success('流程已删除');
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });

  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => executeFlow(id, input),
    onSuccess: (result) => {
      setExecutionResult(result);
      message.success(`流程执行完成：${result.status}`);
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    }
  });

  const openCreate = () => {
    const firstSkill = skills[0];
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      name: 'GIS Solution Flow',
      category: 'Solution',
      version: '1.0.0',
      status: 'ACTIVE',
      nodesJson: firstSkill ? JSON.stringify([{ clientId: 'n1', skillId: firstSkill.id, nodeName: 'summary', positionX: 120, positionY: 80, paramOverrides: '{}', timeoutSeconds: 60, retryCount: 0 }], null, 2) : '[]',
      edgesJson: '[]'
    });
    setModalOpen(true);
  };

  const openEdit = (flow: Flow) => {
    setEditing(flow);
    form.setFieldsValue({
      name: flow.name,
      description: flow.description,
      category: flow.category,
      version: flow.version,
      status: flow.status,
      nodesJson: JSON.stringify(flow.nodes || [], null, 2),
      edgesJson: JSON.stringify(flow.edges || [], null, 2)
    });
    setModalOpen(true);
  };

  const openExecute = (flow: Flow) => {
    setExecuting(flow);
    setExecutionResult(null);
    executeForm.setFieldsValue({ inputJson: defaultInputJson });
  };

  const submitFlow = (values: FlowPayload & { nodesJson: string; edgesJson: string }) => {
    try {
      const nodes = JSON.parse(values.nodesJson || '[]');
      const edges = JSON.parse(values.edgesJson || '[]');
      saveMutation.mutate({ ...values, nodes, edges });
    } catch {
      message.error('节点和连线必须是合法 JSON 数组');
    }
  };

  const submitExecute = ({ inputJson }: { inputJson: string }) => {
    if (!executing) return;
    try {
      executeMutation.mutate({ id: executing.id, input: JSON.parse(inputJson || '{}') });
    } catch {
      message.error('执行输入必须是合法 JSON');
    }
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Text className="gis-section-kicker">FLOW ORCHESTRATION</Typography.Text>
          <Typography.Title level={3}>流程编排</Typography.Title>
          <Typography.Text type="secondary">把多个 Skill 组织为 DAG，并按拓扑顺序真实执行。</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => flowsQuery.refetch()}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={skillsQuery.isSuccess && skills.length === 0}>新建流程</Button>
        </Space>
      </div>

      {skills.length === 0 && <Alert type="warning" showIcon message="请先在技能管理中创建至少一个 Skill，再编排流程。" />}

      <div className="gis-stat-grid">
        {stats.map((item) => <Card key={item.label} className={`gis-glass-card gis-stat-card is-${item.tone}`}><span>{item.label}</span><strong>{item.value}</strong></Card>)}
      </div>

      {flowsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {flowsQuery.isError && <Result status="error" title="流程列表加载失败" subTitle={(flowsQuery.error as Error).message} extra={<Button onClick={() => flowsQuery.refetch()}>重试</Button>} />}
      {flowsQuery.isSuccess && flows.length === 0 && <Card className="gis-glass-card"><Empty description="还没有流程"><Button type="primary" icon={<PlusOutlined />} disabled={skillsQuery.isSuccess && skills.length === 0} onClick={openCreate}>创建第一个流程</Button></Empty></Card>}
      {flowsQuery.isSuccess && flows.length > 0 && (
        <Card className="gis-glass-card gis-table-card">
          <Table<Flow>
            rowKey="id"
            dataSource={flows}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '流程名称', dataIndex: 'name' },
              { title: '分类', dataIndex: 'category', width: 120 },
              { title: '版本', dataIndex: 'version', width: 100 },
              { title: '节点', width: 80, render: (_, record) => record.nodes?.length || 0 },
              { title: '连线', width: 80, render: (_, record) => record.edges?.length || 0 },
              { title: '状态', dataIndex: 'status', width: 90, render: (value) => <Tag color={value === 'DISABLED' ? 'default' : 'green'}>{value || 'ACTIVE'}</Tag> },
              { title: '操作', width: 230, render: (_, record) => <Space><Button icon={<PlayCircleOutlined />} onClick={() => openExecute(record)}>执行</Button><Button icon={<EditOutlined />} onClick={() => openEdit(record)} /><Popconfirm title="确认删除这个流程？" onConfirm={() => deleteMutation.mutate(record.id)}><Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending} /></Popconfirm></Space> }
            ]}
          />
        </Card>
      )}

      <Modal title={editing ? '编辑流程' : '新建流程'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} confirmLoading={saveMutation.isPending} width={900} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={submitFlow} preserve={false}>
          <Space size={16} className="form-row">
            <Form.Item name="name" label="流程名称" className="form-item-half" rules={[{ required: true, message: '请输入流程名称' }]}><Input /></Form.Item>
            <Form.Item name="category" label="分类" className="form-item-half"><Input /></Form.Item>
          </Space>
          <Space size={16} className="form-row">
            <Form.Item name="version" label="版本" className="form-item-half"><Input /></Form.Item>
            <Form.Item name="status" label="状态" className="form-item-half"><Select options={statusOptions} /></Form.Item>
          </Space>
          <Form.Item name="description" label="描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="nodesJson" label="节点 JSON" rules={[{ required: true, message: '请输入节点 JSON' }]}><TextArea rows={8} /></Form.Item>
          <Form.Item name="edgesJson" label="连线 JSON"><TextArea rows={5} placeholder='[{"sourceNodeId":"n1","targetNodeId":"n2"}]' /></Form.Item>
        </Form>
      </Modal>

      <Modal title={`执行流程${executing ? ` - ${executing.name}` : ''}`} open={!!executing} onCancel={() => setExecuting(null)} footer={null} width={900} destroyOnClose>
        <Form form={executeForm} layout="vertical" onFinish={submitExecute}>
          <Form.Item name="inputJson" label="输入上下文 JSON" rules={[{ required: true, message: '请输入执行输入 JSON' }]}><TextArea rows={7} /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<NodeIndexOutlined />} loading={executeMutation.isPending}>执行 DAG</Button>
        </Form>
        {executionResult && <Card className="search-result-card gis-glass-card" title={`执行结果：${executionResult.status}`}><pre className="github-readme-preview">{executionResult.outputContext}</pre></Card>}
      </Modal>
    </Space>
  );
}

