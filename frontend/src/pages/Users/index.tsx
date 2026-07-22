import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserSwitchOutlined
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
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { useMemo, useState } from 'react';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type UserAccount,
  type UserCreatePayload,
  type UserQuery,
  type UserUpdatePayload
} from '../../api/users';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';
import { useAuthStore } from '../../stores/authStore';

const roleOptions = [
  { label: '管理员', value: 'ADMIN' },
  { label: '解决方案工程师', value: 'ENGINEER' }
];

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
];

function roleLabel(role?: string) {
  if (role === 'ADMIN') return '管理员';
  if (role === 'ENGINEER' || role === 'USER') return '解决方案工程师';
  return role || '-';
}

function statusLabel(status?: string) {
  return status === 'DISABLED' ? '停用' : '启用';
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function buildQuery(values: UserQuery): UserQuery {
  const query: UserQuery = {};
  if (values.keyword?.trim()) query.keyword = values.keyword.trim();
  if (values.role) query.role = values.role;
  if (values.status) query.status = values.status;
  return query;
}

export default function UserManagerPage() {
  const [createForm] = Form.useForm<UserCreatePayload>();
  const [editForm] = Form.useForm<UserUpdatePayload>();
  const [filterForm] = Form.useForm<UserQuery>();
  const [passwordForm] = Form.useForm<{ newPassword: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.userId);
  const currentRole = useAuthStore((state) => state.role || 'USER');
  const isAdmin = currentRole === 'ADMIN';
  const [filters, setFilters] = useState<UserQuery>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [resetting, setResetting] = useState<UserAccount | null>(null);

  const usersQuery = useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsers(filters),
    enabled: isAdmin
  });

  const users = usersQuery.data || [];
  const stats = useMemo(() => [
    { label: '用户总数', value: users.length, helper: '平台账号', tone: 'cyan' as const },
    { label: '管理员', value: users.filter((item) => item.role === 'ADMIN').length, helper: '全局权限', tone: 'green' as const },
    { label: '工程师', value: users.filter((item) => item.role === 'ENGINEER' || item.role === 'USER').length, helper: '方案交付成员', tone: 'blue' as const },
    { label: '停用账号', value: users.filter((item) => item.status === 'DISABLED').length, helper: '访问受限', tone: 'amber' as const }
  ], [users]);

  const createMutation = useMutation({
    mutationFn: (values: UserCreatePayload) => createUser({
      username: values.username.trim(),
      password: values.password,
      realName: values.realName?.trim() || undefined,
      role: values.role,
      status: values.status || 'ACTIVE'
    }),
    onSuccess: () => {
      message.success('用户已创建');
      setCreateOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: UserUpdatePayload }) => updateUser(id, {
      realName: values.realName.trim(),
      role: values.role,
      status: values.status
    }),
    onSuccess: () => {
      message.success('用户已更新');
      setEditing(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('用户已删除');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => resetUserPassword(id, newPassword),
    onSuccess: () => {
      message.success('密码已重置');
      setResetting(null);
      passwordForm.resetFields();
    },
    onError: (error) => message.error((error as Error).message)
  });

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({ role: 'ENGINEER', status: 'ACTIVE' });
    setCreateOpen(true);
  };

  const openEdit = (user: UserAccount) => {
    setEditing(user);
    editForm.setFieldsValue({
      realName: user.realName || user.username,
      role: user.role === 'USER' ? 'ENGINEER' : user.role,
      status: user.status || 'ACTIVE'
    });
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };

  if (!isAdmin) {
    return (
      <Result
        status="403"
        title="暂无访问权限"
        subTitle="用户权限页面仅 ADMIN 可访问。当前页面不会发起用户列表请求。"
      />
    );
  }

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page users-permission-page">
      <PageHeader
        eyebrow="IDENTITY & ACCESS"
        title="用户权限"
        description="管理平台成员、角色权限和账号状态，支撑方案交付团队协同。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => usersQuery.refetch()}>刷新</Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增用户</Button>
        ]}
      />

      <StatGrid items={stats} />

      <Card className="toolbar-card users-filter-card">
        <Form form={filterForm} layout="inline" onFinish={(values) => setFilters(buildQuery(values))} className="users-filter-form">
          <Form.Item name="keyword" className="users-keyword">
            <Input allowClear prefix={<SearchOutlined />} placeholder="搜索用户名或姓名" />
          </Form.Item>
          <Form.Item name="role"><Select allowClear placeholder="角色" options={roleOptions} /></Form.Item>
          <Form.Item name="status"><Select allowClear placeholder="状态" options={statusOptions} /></Form.Item>
          <Form.Item className="users-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit">筛选</Button>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增用户</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {usersQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {usersQuery.isError && <Result status="error" title="用户列表加载失败" subTitle={(usersQuery.error as Error).message} extra={<Button onClick={() => usersQuery.refetch()}>重试</Button>} />}
      {usersQuery.isSuccess && users.length === 0 && (
        <Card><Empty description="还没有用户"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建第一个用户</Button></Empty></Card>
      )}
      {usersQuery.isSuccess && users.length > 0 && (
        <Card className="gis-table-card users-table-card">
          <Table<UserAccount>
            rowKey="id"
            dataSource={users}
            pagination={{ pageSize: 9 }}
            columns={[
              { title: '用户名', dataIndex: 'username', width: 180 },
              { title: '姓名', dataIndex: 'realName', width: 180, render: (value: string | undefined, record: UserAccount) => value || record.username },
              { title: '角色', dataIndex: 'role', width: 170, render: (value?: string) => <StatusPill tone={value === 'ADMIN' ? 'green' : 'cyan'}>{roleLabel(value)}</StatusPill> },
              { title: '状态', dataIndex: 'status', width: 110, render: (value?: string) => <StatusPill tone={value === 'DISABLED' ? 'muted' : 'green'}>{statusLabel(value)}</StatusPill> },
              { title: '最近登录', dataIndex: 'lastLoginAt', width: 190, render: formatDate },
              {
                title: '操作',
                width: 286,
                render: (_, record) => {
                  const isSelf = record.id === currentUserId;
                  return (
                    <Space size={8}>
                      <Button icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
                      <Button icon={<KeyOutlined />} onClick={() => { setResetting(record); passwordForm.setFieldsValue({ newPassword: '' }); }}>重置密码</Button>
                      <Popconfirm
                        title={isSelf ? '不能删除当前登录用户' : '确认删除该用户？'}
                        disabled={isSelf}
                        onConfirm={() => deleteMutation.mutate(record.id)}
                      >
                        <Button danger icon={<DeleteOutlined />} disabled={isSelf} title={isSelf ? '不能删除当前登录用户' : undefined} loading={deleteMutation.isPending} />
                      </Popconfirm>
                    </Space>
                  );
                }
              }
            ]}
          />
        </Card>
      )}

      <section className="users-role-guide">
        <Card title="ADMIN" className="users-role-card">
          <Tag color="green">平台管理员</Tag>
          <Typography.Paragraph>拥有用户权限、系统配置、模板资产和项目数据的全局管理权限。</Typography.Paragraph>
          <Alert type="info" showIcon message="安全边界" description="建议至少保留一个启用管理员，避免团队无法维护系统配置。" />
        </Card>
        <Card title="ENGINEER" className="users-role-card">
          <Tag color="blue">解决方案工程师</Tag>
          <Typography.Paragraph>负责项目方案交付、Flow 执行、Agent Skill 测试、成果物生成和模板复用。</Typography.Paragraph>
          <Alert type="success" showIcon message="工作范围" description="默认不进入用户权限管理，专注方案生产与项目交付。" />
        </Card>
      </section>

      <Modal
        title="新增用户"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
        width={620}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" preserve={false} onFinish={(values) => createMutation.mutate(values)}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}><Input placeholder="例如 zhangsan" /></Form.Item>
          <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }]}><Input.Password placeholder="建议至少 6 位" /></Form.Item>
          <Form.Item name="realName" label="姓名"><Input placeholder="可选；留空时后端使用用户名" /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}><Select options={roleOptions} /></Form.Item>
          <Form.Item name="status" label="状态"><Select options={statusOptions} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`编辑用户${editing ? ` - ${editing.username}` : ''}`}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        width={620}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" preserve={false} onFinish={(values) => editing && updateMutation.mutate({ id: editing.id, values })}>
          <Alert type="info" showIcon message="编辑用户不会提交 username/password" className="users-edit-alert" />
          <Form.Item label="用户名"><Input value={editing?.username} disabled /></Form.Item>
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}><Input /></Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}><Select options={roleOptions} /></Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}><Select options={statusOptions} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重置密码${resetting ? ` - ${resetting.username}` : ''}`}
        open={!!resetting}
        onCancel={() => setResetting(null)}
        onOk={() => passwordForm.submit()}
        confirmLoading={resetPasswordMutation.isPending}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={({ newPassword }) => resetting && resetPasswordMutation.mutate({ id: resetting.id, newPassword })}>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}><Input.Password prefix={<UserSwitchOutlined />} /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
