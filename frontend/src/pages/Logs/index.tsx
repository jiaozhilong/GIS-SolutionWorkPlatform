import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Form, Input, Result, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { listSystemLogs, type SystemLog, type SystemLogQuery } from '../../api/logs';

const logTypeOptions = ['FLOW', 'SKILL', 'LLM', 'GITHUB'].map((value) => ({ label: value, value }));
const levelOptions = ['INFO', 'WARN', 'ERROR'].map((value) => ({ label: value, value }));

function levelColor(level?: string) {
  if (level === 'ERROR') return 'red';
  if (level === 'WARN') return 'orange';
  return 'cyan';
}

function detailPreview(value?: string) {
  if (!value) return '-';
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

export default function SystemLogsPage() {
  const [form] = Form.useForm<SystemLogQuery>();
  const [query, setQuery] = useState<SystemLogQuery>({ page: 1, pageSize: 10 });

  const logsQuery = useQuery({
    queryKey: ['system-logs', query],
    queryFn: () => listSystemLogs(query)
  });

  const data = logsQuery.data;
  const stats = useMemo(() => {
    const typeStats = data?.logTypeStats || {};
    const errorCount = data?.levelStats?.ERROR || 0;
    return [
      { label: '日志总数', value: data?.total || 0, tone: 'cyan' },
      { label: 'FLOW', value: typeStats.FLOW || 0, tone: 'green' },
      { label: '错误日志', value: errorCount, tone: 'amber' },
      { label: '平均耗时(ms)', value: data?.avgDurationMs || 0, tone: 'blue' }
    ];
  }, [data]);

  const submit = (values: SystemLogQuery) => {
    setQuery({ ...values, page: 1, pageSize: query.pageSize || 10 });
  };

  const reset = () => {
    form.resetFields();
    setQuery({ page: 1, pageSize: 10 });
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Text className="gis-section-kicker">OBSERVABILITY</Typography.Text>
          <Typography.Title level={3}>系统日志</Typography.Title>
          <Typography.Text type="secondary">统一查看 Flow、Skill、LLM、GitHub 等模块写入的运行日志。</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => logsQuery.refetch()}>刷新</Button>
      </div>

      <div className="gis-stat-grid">
        {stats.map((item) => <Card key={item.label} className={`gis-glass-card gis-stat-card is-${item.tone}`}><span>{item.label}</span><strong>{item.value}</strong></Card>)}
      </div>

      <Card className="gis-glass-card">
        <Form form={form} layout="vertical" onFinish={submit}>
          <Space size={16} wrap className="form-row">
            <Form.Item name="logType" label="类型" className="form-item-half"><Select allowClear options={logTypeOptions} placeholder="全部类型" /></Form.Item>
            <Form.Item name="level" label="等级" className="form-item-half"><Select allowClear options={levelOptions} placeholder="全部等级" /></Form.Item>
            <Form.Item name="module" label="模块" className="form-item-half"><Input allowClear placeholder="例如 Flow / LLM" /></Form.Item>
            <Form.Item name="keyword" label="关键字" className="form-item-half"><Input allowClear placeholder="搜索 action、message、detail、refId" /></Form.Item>
          </Space>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>筛选</Button>
            <Button onClick={reset}>重置</Button>
          </Space>
        </Form>
      </Card>

      {logsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {logsQuery.isError && <Result status="error" title="日志加载失败" subTitle={(logsQuery.error as Error).message} extra={<Button onClick={() => logsQuery.refetch()}>重试</Button>} />}
      {logsQuery.isSuccess && (
        <Card className="gis-glass-card gis-table-card">
          <Table<SystemLog>
            rowKey="id"
            dataSource={data?.records || []}
            scroll={{ x: 1320 }}
            pagination={{
              current: query.page || 1,
              pageSize: query.pageSize || 10,
              total: data?.total || 0,
              showSizeChanger: true,
              onChange: (page, pageSize) => setQuery((current) => ({ ...current, page, pageSize }))
            }}
            columns={[
              { title: '时间', dataIndex: 'createdAt', width: 210, render: (value) => (value ? String(value).replace('T', ' ') : '-') },
              { title: '类型', dataIndex: 'logType', width: 100, render: (value) => <Tag color="cyan">{value || 'UNKNOWN'}</Tag> },
              { title: '等级', dataIndex: 'level', width: 90, render: (value) => <Tag color={levelColor(value)}>{value || 'INFO'}</Tag> },
              { title: '模块', dataIndex: 'module', width: 110 },
              { title: '动作', dataIndex: 'action', width: 150, ellipsis: true },
              { title: '关联ID', dataIndex: 'refId', width: 160, ellipsis: true },
              { title: '耗时', dataIndex: 'durationMs', width: 90, render: (value) => (value == null ? '-' : `${value} ms`) },
              { title: '摘要', dataIndex: 'message', width: 180, ellipsis: true },
              { title: '详情', dataIndex: 'detail', width: 280, ellipsis: true, render: detailPreview }
            ]}
          />
        </Card>
      )}
    </Space>
  );
}