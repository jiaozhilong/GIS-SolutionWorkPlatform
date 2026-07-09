import { Alert, Button, Card, Result, Skeleton, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getHello } from './api/hello';
import GisBackground from './components/GisBackground';
import GisSidebar from './components/GisSidebar';
import ProjectManagerPage from './pages/Projects';
import ImaConfigPage from './pages/Settings/ImaConfig';
import LlmConfigPage from './pages/Settings/LlmConfig';
import GitHubConfigPage from './pages/Settings/GitHubConfig';
import SkillManagerPage from './pages/Skills';
import FlowManagerPage from './pages/Flows';

function App() {
  return (
    <div className="gis-app-shell">
      <GisBackground />
      <GisSidebar />
      <main className="gis-main">
        <header className="gis-topbar">
          <div>
            <Typography.Text className="gis-topbar-kicker">LOCAL GIS AI WORKBENCH</Typography.Text>
            <Typography.Title level={3}>GIS 解决方案 AI 工作平台</Typography.Title>
          </div>
          <Typography.Text className="gis-env-pill">本地开发环境</Typography.Text>
        </header>
        <section className="gis-content">
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectManagerPage />} />
            <Route path="/settings/ima" element={<ImaConfigPage />} />
            <Route path="/settings/llm" element={<LlmConfigPage />} />
            <Route path="/settings/github" element={<GitHubConfigPage />} />
            <Route path="/skills" element={<SkillManagerPage />} />
            <Route path="/flows" element={<FlowManagerPage />} />
            <Route path="/templates" element={<ComingSoon title="模板管理" />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </section>
      </main>
    </div>
  );
}

function Dashboard() {
  const helloQuery = useQuery({
    queryKey: ['hello'],
    queryFn: getHello,
    retry: 1
  });

  return (
    <Space direction="vertical" size={16} className="content-stack gis-page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>平台状态</Typography.Title>
          <Typography.Text type="secondary">当前已完成后端、数据库、项目管理、IMA 和大模型配置闭环。</Typography.Text>
        </div>
      </div>
      <Card className="gis-glass-card" title="后端连接状态">
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

function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="gis-glass-card">
      <Result status="info" title={`${title} 正在开发`} subTitle="当前按 TODO 顺序继续接入真实后端接口。" />
    </Card>
  );
}

export default App;




