import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  ProjectOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Empty, Progress, Result, Skeleton, Space, Table, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listFlows } from '../../api/flows';
import { getHello } from '../../api/hello';
import { listSystemLogs, type SystemLogPage } from '../../api/logs';
import { listProjects, type Project } from '../../api/projects';
import { listSkills } from '../../api/skills';
import { StatusPill } from '../../components/Workbench';

const t = {
  eyebrow: '\u5e73\u53f0\u603b\u89c8',
  title: '\u6b22\u8fce\u56de\u6765\uff0c\u5f20\u4f1f',
  description: '\u9ad8\u6548\u7ec4\u7ec7\u9879\u76ee\u4ea4\u4ed8\uff0c\u8ba9\u6bcf\u4e00\u6b21\u65b9\u6848\u90fd\u66f4\u6709\u4ef7\u503c\u3002',
  runFlow: '\u8fd0\u884c Flow',
  newProject: '\u65b0\u5efa\u9879\u76ee',
  activeProjects: '\u8fdb\u884c\u4e2d\u9879\u76ee',
  monthlyDelivery: '\u672c\u6708\u4ea4\u4ed8',
  pendingTasks: '\u5f85\u529e\u4efb\u52a1',
  reuseRate: '\u65b9\u6848\u590d\u7528\u7387',
  agentSuccess: 'Agent \u6210\u529f\u7387',
  avgCycle: '\u5e73\u5747\u4ea4\u4ed8\u5468\u671f',
  estimated: '\u57fa\u4e8e\u73b0\u6709\u9879\u76ee/\u65e5\u5fd7\u4f30\u7b97',
  projectsOverview: '\u9879\u76ee\u6982\u89c8',
  aiRecommendations: 'AI \u52a9\u7406\u63a8\u8350',
  deliveryOverview: '\u4ea4\u4ed8\u5168\u94fe\u8def\u6982\u89c8',
  health: '\u7cfb\u7edf\u5065\u5eb7',
  retry: '\u91cd\u8bd5',
  emptyProjects: '\u6682\u65e0\u9879\u76ee\uff0c\u53ef\u4ee5\u5148\u65b0\u5efa\u4e00\u4e2a GIS \u4ea4\u4ed8\u9879\u76ee',
  apiError: '\u8be5\u6a21\u5757\u52a0\u8f7d\u5931\u8d25\uff0c\u4e0d\u5f71\u54cd\u5176\u4ed6\u533a\u57df',
  total: '\u9879\u76ee\u5408\u8ba1',
  flowCount: 'Flow \u6570',
  skillCount: 'Skill \u6570',
  errorLogs: '\u5f02\u5e38\u65e5\u5fd7',
  stages: ['\u9700\u6c42\u5206\u6790', '\u4ea7\u54c1\u5339\u914d', '\u6848\u4f8b\u68c0\u7d22', '\u67b6\u6784\u8bbe\u8ba1', '\u65b9\u6848\u64b0\u5199', 'PPT \u751f\u6210']
};

type DashboardTone = 'green' | 'cyan' | 'amber' | 'red' | 'blue';

interface DashboardStat {
  key: string;
  label: string;
  value: number;
  suffix?: string;
  helper: ReactNode;
  tone: DashboardTone;
  progress?: number;
}

interface DashboardViewModel {
  stats: DashboardStat[];
  recommendations: Array<{
    key: string;
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    action: () => void;
    tone: DashboardTone;
  }>;
  healthPercent: number;
}

const statusLabelMap: Record<string, string> = {
  OPPORTUNITY: '\u5546\u673a',
  ANALYSIS: '\u9700\u6c42\u5206\u6790',
  PROPOSAL: '\u65b9\u6848\u8bbe\u8ba1',
  BIDDING: '\u6295\u6807',
  DELIVERY: '\u4ea4\u4ed8\u4e2d',
  SIGNED: '\u5df2\u7b7e\u7ea6',
  CLOSED: '\u5df2\u5173\u95ed'
};

const statusProgressMap: Record<string, number> = {
  OPPORTUNITY: 18,
  ANALYSIS: 36,
  PROPOSAL: 58,
  BIDDING: 72,
  DELIVERY: 86,
  SIGNED: 100,
  CLOSED: 100
};

function getStatusLabel(status?: string) {
  return status ? statusLabelMap[status] || status : '\u5546\u673a';
}

function getProjectProgress(project: Project) {
  return statusProgressMap[project.status || 'OPPORTUNITY'] ?? 24;
}

function getStatusTone(status?: string): DashboardTone | 'muted' {
  if (status === 'SIGNED' || status === 'DELIVERY') return 'green';
  if (status === 'CLOSED') return 'muted';
  if (status === 'BIDDING') return 'amber';
  return 'cyan';
}

function formatDate(value?: string) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '-';
}

function useCountUp(value: number, duration = 800) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const start = performance.now();
    const from = displayValue;
    const delta = value - from;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + delta * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, value]);

  return displayValue;
}

function MetricCard({ stat }: { stat: DashboardStat }) {
  const animated = useCountUp(stat.value);

  return (
    <Card className={`dashboard-stat-card is-${stat.tone}`}>
      <span className="dashboard-stat-card__label">{stat.label}</span>
      <strong>{animated}{stat.suffix || ''}</strong>
      <small>{stat.helper}</small>
      {typeof stat.progress === 'number' && <Progress percent={stat.progress} showInfo={false} size="small" strokeColor="var(--geo-brand)" />}
    </Card>
  );
}

function ModuleError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Result
      className="dashboard-module-error"
      status="warning"
      title={t.apiError}
      subTitle={(error as Error)?.message}
      extra={<Button onClick={onRetry}>{t.retry}</Button>}
    />
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const helloQuery = useQuery({ queryKey: ['hello'], queryFn: getHello, retry: 1 });
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects, retry: 1 });
  const flowsQuery = useQuery({ queryKey: ['flows'], queryFn: listFlows, retry: 1 });
  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: listSkills, retry: 1 });
  const logsQuery = useQuery({
    queryKey: ['system-logs-dashboard'],
    queryFn: () => listSystemLogs({ page: 1, pageSize: 8 }),
    retry: 1
  });

  const projects = projectsQuery.data || [];
  const flows = flowsQuery.data || [];
  const skills = skillsQuery.data || [];
  const logs: SystemLogPage | undefined = logsQuery.data;
  const errorLogs = logs?.levelStats?.ERROR || 0;

  const viewModel: DashboardViewModel = useMemo(() => {
    const activeProjects = projects.filter((item) => !['SIGNED', 'CLOSED'].includes(item.status || '')).length;
    const deliveredProjects = projects.filter((item) => ['SIGNED', 'DELIVERY'].includes(item.status || '')).length;
    const activeSkills = skills.filter((item) => item.status !== 'DISABLED').length;
    const pendingTasks = activeProjects + errorLogs + Math.max(0, flows.filter((flow) => flow.status !== 'DISABLED').length - 1);
    const reuseRate = Math.min(92, 52 + flows.length * 7 + Math.floor(projects.length / 2));
    const agentSuccessRate = Math.max(72, Math.min(98, 96 - errorLogs * 3 + Math.floor(activeSkills / 4)));
    const avgCycle = Math.max(7, 18 - Math.min(flows.length, 8) - Math.floor(deliveredProjects / 2));
    const healthPercent = Math.max(64, Math.min(99, 96 - errorLogs * 5 + (helloQuery.isSuccess ? 3 : 0)));

    return {
      stats: [
        {
          key: 'active',
          label: t.activeProjects,
          value: activeProjects,
          helper: `${t.total} ${projects.length}`,
          tone: 'green',
          progress: projects.length ? Math.round((activeProjects / projects.length) * 100) : 0
        },
        {
          key: 'delivered',
          label: t.monthlyDelivery,
          value: deliveredProjects,
          helper: '\u7b7e\u7ea6/\u4ea4\u4ed8\u9636\u6bb5',
          tone: 'cyan',
          progress: projects.length ? Math.round((deliveredProjects / projects.length) * 100) : 0
        },
        {
          key: 'tasks',
          label: t.pendingTasks,
          value: pendingTasks,
          helper: <Tooltip title={t.estimated}>{errorLogs ? `${errorLogs} \u6761\u5f02\u5e38\u5f85\u5904\u7406` : t.estimated}</Tooltip>,
          tone: errorLogs ? 'amber' : 'blue',
          progress: Math.min(100, pendingTasks * 8)
        },
        {
          key: 'reuse',
          label: t.reuseRate,
          value: reuseRate,
          suffix: '%',
          helper: <Tooltip title={t.estimated}>{`${t.flowCount} ${flows.length}`}</Tooltip>,
          tone: 'green',
          progress: reuseRate
        },
        {
          key: 'agent',
          label: t.agentSuccess,
          value: agentSuccessRate,
          suffix: '%',
          helper: <Tooltip title={t.estimated}>{`${t.skillCount} ${activeSkills}`}</Tooltip>,
          tone: errorLogs ? 'amber' : 'cyan',
          progress: agentSuccessRate
        },
        {
          key: 'cycle',
          label: t.avgCycle,
          value: avgCycle,
          suffix: 'd',
          helper: <Tooltip title={t.estimated}>{'\u6309\u9879\u76ee\u89c4\u6a21\u4e0e Flow \u6570\u4f30\u7b97'}</Tooltip>,
          tone: 'blue',
          progress: Math.max(18, 100 - avgCycle * 4)
        }
      ],
      recommendations: [
        {
          key: 'project-risk',
          icon: <AlertOutlined />,
          title: errorLogs ? '\u9879\u76ee\u98ce\u9669\u63d0\u9192' : '\u4ea4\u4ed8\u8282\u594f\u5065\u5eb7',
          description: errorLogs ? `\u6700\u8fd1\u53d1\u73b0 ${errorLogs} \u6761\u5f02\u5e38\u65e5\u5fd7\uff0c\u5efa\u8bae\u4f18\u5148\u590d\u76d8 Flow \u6267\u884c\u3002` : '\u6682\u672a\u53d1\u73b0\u9ad8\u4f18\u5148\u7ea7\u5f02\u5e38\uff0c\u53ef\u7ee7\u7eed\u63a8\u8fdb\u65b9\u6848\u4ea4\u4ed8\u3002',
          actionLabel: '\u67e5\u770b\u65e5\u5fd7',
          action: () => navigate('/logs'),
          tone: errorLogs ? 'amber' : 'green'
        },
        {
          key: 'flow-reuse',
          icon: <NodeIndexOutlined />,
          title: '\u590d\u7528 Flow \u6a21\u677f',
          description: `\u5df2\u53d1\u73b0 ${flows.length} \u6761 Flow\uff0c\u53ef\u4f5c\u4e3a\u65b9\u6848\u751f\u6210\u548c PPT \u4ea4\u4ed8\u7684\u81ea\u52a8\u5316\u5e95\u5ea7\u3002`,
          actionLabel: t.runFlow,
          action: () => navigate('/flows'),
          tone: 'cyan'
        },
        {
          key: 'knowledge',
          icon: <DatabaseOutlined />,
          title: '\u77e5\u8bc6\u4e0e\u6280\u80fd\u8865\u5f3a',
          description: `\u5f53\u524d\u542f\u7528 ${activeSkills} \u4e2a Agent Skill\uff0c\u5efa\u8bae\u7ed3\u5408 IMA \u68c0\u7d22\u8865\u5168\u884c\u4e1a\u6848\u4f8b\u3002`,
          actionLabel: '\u67e5\u770b Skill',
          action: () => navigate('/skills'),
          tone: 'blue'
        }
      ],
      healthPercent
    };
  }, [errorLogs, flows, helloQuery.isSuccess, navigate, projects, skills]);

  const projectColumns = [
    {
      title: '\u9879\u76ee\u540d\u79f0',
      dataIndex: 'name',
      width: 260,
      render: (value: string, record: Project) => (
        <Button
          className="gis-link-button"
          type="link"
          onClick={() => navigate('/projects', { state: { openProjectId: record.id } })}
        >
          {value}
        </Button>
      )
    },
    { title: '\u5ba2\u6237', dataIndex: 'customerName', width: 170, render: (value?: string) => value || '-' },
    { title: '\u9636\u6bb5', dataIndex: 'status', width: 130, render: (value?: string) => <StatusPill tone={getStatusTone(value)}>{getStatusLabel(value)}</StatusPill> },
    {
      title: '\u8fdb\u5ea6',
      dataIndex: 'status',
      width: 160,
      render: (_: string, record: Project) => <Progress percent={getProjectProgress(record)} showInfo={false} size="small" strokeColor="#167D64" />
    },
    { title: '\u8d1f\u8d23\u4eba', width: 100, render: () => '\u65b9\u6848\u7ec4' },
    { title: '\u66f4\u65b0\u65f6\u95f4', dataIndex: 'updatedAt', width: 160, render: formatDate }
  ];

  if (import.meta.env.DEV && new URLSearchParams(location.search).get('__debugRenderError') === '1') {
    throw new Error('AppErrorBoundary render test');
  }

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <Typography.Text className="gis-section-kicker">MISSION OVERVIEW</Typography.Text>
          <Typography.Title level={3}>{t.title}</Typography.Title>
          <Typography.Text type="secondary">{t.description}</Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<RocketOutlined />} onClick={() => navigate('/flows')}>{t.runFlow}</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects?create=1', { state: { openCreate: true } })}>{t.newProject}</Button>
        </Space>
      </section>

      <div className="dashboard-stat-grid">
        {viewModel.stats.map((stat) => <MetricCard key={stat.key} stat={stat} />)}
      </div>

      <div className="dashboard-main-grid">
        <Card className="gis-table-card dashboard-project-card" title={t.projectsOverview}>
          {projectsQuery.isLoading && <Skeleton active paragraph={{ rows: 7 }} />}
          {projectsQuery.isError && <ModuleError error={projectsQuery.error} onRetry={() => projectsQuery.refetch()} />}
          {projectsQuery.isSuccess && projects.length === 0 && (
            <Empty description={t.emptyProjects}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects?create=1', { state: { openCreate: true } })}>{t.newProject}</Button>
            </Empty>
          )}
          {projectsQuery.isSuccess && projects.length > 0 && (
            <Table<Project>
              rowKey="id"
              dataSource={projects.slice(0, 8)}
              columns={projectColumns}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 980 }}
            />
          )}
        </Card>

        <Space direction="vertical" size={16} className="content-stack">
          <Card className="dashboard-ai-card" title={t.aiRecommendations}>
            <Space direction="vertical" size={12} className="content-stack">
              {viewModel.recommendations.map((item) => (
                <button key={item.key} className={`dashboard-ai-item is-${item.tone}`} onClick={item.action} type="button">
                  <span className="dashboard-ai-item__icon">{item.icon}</span>
                  <span className="dashboard-ai-item__body">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                    <em>{item.actionLabel}</em>
                  </span>
                </button>
              ))}
            </Space>
          </Card>

          <Card className="dashboard-health-card" title={t.health}>
            <Space direction="vertical" size={10} className="content-stack">
              <StatusPill tone={helloQuery.isSuccess ? 'green' : 'amber'}>
                {helloQuery.isSuccess ? '\u63a5\u53e3\u8fde\u63a5\u6b63\u5e38' : '\u5065\u5eb7\u68c0\u67e5\u672a\u8fde\u901a'}
              </StatusPill>
              <Progress percent={viewModel.healthPercent} strokeColor="#167D64" />
              {logsQuery.isError ? (
                <Typography.Text type="secondary">{t.apiError}</Typography.Text>
              ) : (
                <Typography.Text type="secondary">{`${t.errorLogs} ${errorLogs} · ${t.estimated}`}</Typography.Text>
              )}
            </Space>
          </Card>
        </Space>
      </div>

      <Card className="dashboard-delivery-card" title={t.deliveryOverview}>
        <div className="dashboard-delivery-chain">
          {t.stages.map((stage, index) => (
            <button
              key={stage}
              type="button"
              className={`dashboard-delivery-node${index < 4 ? ' is-active' : ''}`}
              onClick={() => navigate(index < 3 ? '/flows' : index === 3 ? '/projects' : '/templates')}
            >
              <span className="dashboard-delivery-node__icon">
                {index === 0 && <FileSearchOutlined />}
                {index === 1 && <DatabaseOutlined />}
                {index === 2 && <CheckCircleOutlined />}
                {index === 3 && <ProjectOutlined />}
                {index === 4 && <FileTextOutlined />}
                {index === 5 && <ThunderboltOutlined />}
              </span>
              <strong>{stage}</strong>
              <small>{index < 4 ? '\u8fd0\u884c\u4e2d' : '\u672a\u5f00\u59cb'}</small>
            </button>
          ))}
        </div>
      </Card>
    </Space>
  );
}
