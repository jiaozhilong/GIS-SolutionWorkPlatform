import { ApiOutlined, AppstoreOutlined, DatabaseOutlined, FileTextOutlined, NodeIndexOutlined, ProjectOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Layout, Menu, Result, Skeleton, Space, Typography } from 'antd';
import { getHello } from './api/hello';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: 'dashboard', icon: <AppstoreOutlined />, label: '仪表盘' },
  { key: 'projects', icon: <ProjectOutlined />, label: '项目' },
  { key: 'skills', icon: <ApiOutlined />, label: '技能' },
  { key: 'flows', icon: <NodeIndexOutlined />, label: '流程' },
  { key: 'templates', icon: <FileTextOutlined />, label: '模板' },
  { key: 'data', icon: <DatabaseOutlined />, label: '知识配置' },
  { key: 'settings', icon: <SettingOutlined />, label: '设置' }
];

function App() {
  const helloQuery = useQuery({
    queryKey: ['hello'],
    queryFn: getHello,
    retry: 1
  });

  return (
    <Layout className="app-shell">
      <Sider width={240}>
        <div className="brand">GIS AI Platform</div>
        <Menu theme="dark" mode="inline" selectedKeys={['dashboard']} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Typography.Text strong>GIS 解决方案 AI 工作平台</Typography.Text>
          <Typography.Text type="secondary">本地开发环境</Typography.Text>
        </Header>
        <Content className="app-content">
          <Space direction="vertical" size={16} className="content-stack">
            <div>
              <Typography.Title level={3}>平台底座</Typography.Title>
              <Typography.Text type="secondary">当前完成 TODO-01：前后端脚手架与真实接口联通。</Typography.Text>
            </div>

            <Card title="后端连接状态">
              {helloQuery.isLoading && <Skeleton active paragraph={{ rows: 2 }} />}
              {helloQuery.isError && (
                <Result
                  status="error"
                  title="后端接口暂不可用"
                  subTitle="请确认 Spring Boot 服务已启动在 http://localhost:8080"
                  extra={<a onClick={() => helloQuery.refetch()}>重试连接</a>}
                />
              )}
              {helloQuery.isSuccess && (
                <Alert
                  type="success"
                  showIcon
                  message="接口调用成功"
                  description={`/api/hello 返回：${helloQuery.data}`}
                />
              )}
            </Card>
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;

