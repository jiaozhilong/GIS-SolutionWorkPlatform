import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Result,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { listSystemLogs, type SystemLog, type SystemLogPage, type SystemLogQuery } from '../../api/logs';
import { PageHeader, StatGrid, StatusPill } from '../../components/Workbench';

const { RangePicker } = DatePicker;

const logTypeOptions = ['FLOW', 'SKILL', 'LLM', 'GITHUB'].map((value) => ({ label: value, value }));
const levelOptions = ['INFO', 'WARN', 'ERROR'].map((value) => ({ label: value, value }));

interface LogFilterValues extends Omit<SystemLogQuery, 'startAt' | 'endAt' | 'page' | 'pageSize'> {
  timeRange?: Array<{ format: (pattern: string) => string }> | null;
}

function levelTone(level?: string): 'green' | 'cyan' | 'amber' | 'red' {
  if (level === 'ERROR') return 'red';
  if (level === 'WARN') return 'amber';
  if (level === 'INFO') return 'cyan';
  return 'green';
}

function detailPreview(value?: string) {
  if (!value) return '-';
  return value.length > 120 ? `${value.slice(0, 120)}...` : value;
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 19) : '-';
}

function formatDetail(value?: string) {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function buildQuery(values: LogFilterValues, previous: SystemLogQuery): SystemLogQuery {
  const next: SystemLogQuery = {
    page: 1,
    pageSize: previous.pageSize || 10
  };
  if (values.logType) next.logType = values.logType;
  if (values.level) next.level = values.level;
  if (values.module?.trim()) next.module = values.module.trim();
  if (values.action?.trim()) next.action = values.action.trim();
  if (values.keyword?.trim()) next.keyword = values.keyword.trim();
  if (values.timeRange?.[0]) next.startAt = values.timeRange[0].format('YYYY-MM-DDTHH:mm:ss');
  if (values.timeRange?.[1]) next.endAt = values.timeRange[1].format('YYYY-MM-DDTHH:mm:ss');
  return next;
}

export default function SystemLogsPage() {
  const [form] = Form.useForm<LogFilterValues>();
  const [query, setQuery] = useState<SystemLogQuery>({ page: 1, pageSize: 10 });
  const [selected, setSelected] = useState<SystemLog | null>(null);

  const logsQuery = useQuery({
    queryKey: ['system-logs', query],
    queryFn: () => listSystemLogs(query)
  });

  const data: SystemLogPage | undefined = logsQuery.data;
  const records = data?.records || [];

  useEffect(() => {
    if (!selected && records[0]) {
      setSelected(records[0]);
      return;
    }
    if (selected && records.length > 0 && !records.some((record) => record.id === selected.id)) {
      setSelected(records[0]);
    }
    if (records.length === 0) setSelected(null);
  }, [records, selected]);

  const stats = useMemo(() => {
    const typeStats = data?.logTypeStats || {};
    const errorCount = data?.levelStats?.ERROR || 0;
    return [
      { label: '日志总数', value: data?.total || 0, helper: '当前筛选范围', tone: 'cyan' as const },
      { label: 'Flow 运行', value: typeStats.FLOW || 0, helper: '流程执行记录', tone: 'green' as const },
      { label: '异常日志', value: errorCount, helper: 'ERROR 级别', tone: errorCount ? 'red' as const : 'blue' as const },
      { label: '平均耗时', value: `${data?.avgDurationMs || 0}ms`, helper: '接口与 Agent 调用', tone: 'blue' as const }
    ];
  }, [data]);

  const submitFilters = (values: LogFilterValues) => {
    setQuery((current) => buildQuery(values, current));
  };

  const resetFilters = () => {
    form.resetFields();
    setQuery({ page: 1, pageSize: 10 });
  };

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page logs-observability-page">
      <PageHeader
        eyebrow="OBSERVABILITY"
        title="运行日志"
        description="查看 Flow、Skill、LLM、GitHub 等模块的运行状态、异常详情和关联记录。"
        actions={[
          <Button key="reload" icon={<ReloadOutlined />} onClick={() => logsQuery.refetch()}>刷新</Button>
        ]}
      />

      <StatGrid items={stats} />

      <Card className="toolbar-card logs-filter-card">
        <Form form={form} layout="inline" onFinish={submitFilters} className="logs-filter-form">
          <Form.Item name="logType"><Select allowClear options={logTypeOptions} placeholder="类型" /></Form.Item>
          <Form.Item name="level"><Select allowClear options={levelOptions} placeholder="级别" /></Form.Item>
          <Form.Item name="module"><Input allowClear placeholder="模块" /></Form.Item>
          <Form.Item name="action"><Input allowClear placeholder="操作" /></Form.Item>
          <Form.Item name="keyword" className="logs-keyword"><Input allowClear prefix={<SearchOutlined />} placeholder="关键词 / refId / detail" /></Form.Item>
          <Form.Item name="timeRange" className="logs-time-range"><RangePicker showTime /></Form.Item>
          <Form.Item className="logs-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>筛选</Button>
              <Button onClick={resetFilters}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {logsQuery.isLoading && <Skeleton active paragraph={{ rows: 8 }} />}
      {logsQuery.isError && <Result status="error" title="日志加载失败" subTitle={(logsQuery.error as Error).message} extra={<Button onClick={() => logsQuery.refetch()}>重试</Button>} />}

      {logsQuery.isSuccess && (
        <section className="logs-workbench-grid">
          <Card className="gis-table-card logs-table-card">
            <Table<SystemLog>
              rowKey="id"
              dataSource={records}
              scroll={{ x: 1180 }}
              rowClassName={(record) => record.id === selected?.id ? 'is-selected-row' : ''}
              onRow={(record) => ({ onClick: () => setSelected(record) })}
              pagination={{
                current: data?.page || query.page || 1,
                pageSize: data?.pageSize || query.pageSize || 10,
                total: data?.total || 0,
                showSizeChanger: true,
                onChange: (page, pageSize) => setQuery((current) => ({ ...current, page, pageSize }))
              }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无运行日志" /> }}
              columns={[
                { title: '时间', dataIndex: 'createdAt', width: 170, render: formatDate },
                { title: '模块', dataIndex: 'module', width: 110, render: (value?: string) => value || '-' },
                { title: '操作', dataIndex: 'action', width: 140, ellipsis: true, render: (value?: string) => value || '-' },
                { title: '类型', dataIndex: 'logType', width: 100, render: (value?: string) => <Tag color="cyan">{value || 'UNKNOWN'}</Tag> },
                { title: '级别', dataIndex: 'level', width: 92, render: (value?: string) => <StatusPill tone={levelTone(value)}>{value || 'INFO'}</StatusPill> },
                { title: '摘要', dataIndex: 'message', width: 190, ellipsis: true, render: (value?: string) => value || '-' },
                { title: '耗时', dataIndex: 'durationMs', width: 92, render: (value?: number) => (value == null ? '-' : `${value} ms`) },
                { title: '查看', width: 80, fixed: 'right', render: (_, record) => <Button icon={<EyeOutlined />} onClick={(event) => { event.stopPropagation(); setSelected(record); }} /> }
              ]}
            />
          </Card>

          <aside className="logs-detail-panel">
            {selected ? (
              <Space direction="vertical" size={14} className="content-stack">
                <Card className="logs-detail-card">
                  <Typography.Text className="gis-section-kicker">LOG DETAIL</Typography.Text>
                  <Typography.Title level={4}>{selected.message || '运行日志详情'}</Typography.Title>
                  <Space wrap>
                    <StatusPill tone={levelTone(selected.level)}>{selected.level || 'INFO'}</StatusPill>
                    <Tag color="cyan">{selected.logType || 'UNKNOWN'}</Tag>
                    {selected.refId && <Tag>{selected.refId}</Tag>}
                  </Space>
                </Card>
                <Card title="基本信息" className="logs-detail-card">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Trace ID">{selected.id}</Descriptions.Item>
                    <Descriptions.Item label="模块">{selected.module || '-'}</Descriptions.Item>
                    <Descriptions.Item label="操作">{selected.action || '-'}</Descriptions.Item>
                    <Descriptions.Item label="关联 refId">{selected.refId || '-'}</Descriptions.Item>
                    <Descriptions.Item label="耗时">{selected.durationMs == null ? '-' : `${selected.durationMs} ms`}</Descriptions.Item>
                    <Descriptions.Item label="时间">{formatDate(selected.createdAt)}</Descriptions.Item>
                  </Descriptions>
                </Card>
                <Card title="message" className="logs-detail-card">
                  <Typography.Paragraph>{selected.message || '-'}</Typography.Paragraph>
                </Card>
                <Card title="detail" className="logs-detail-card">
                  <pre className="logs-detail-content">{formatDetail(selected.detail)}</pre>
                </Card>
              </Space>
            ) : (
              <Card className="project-empty-state">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择左侧日志查看详情" />
              </Card>
            )}
          </aside>
        </section>
      )}
    </Space>
  );
}
