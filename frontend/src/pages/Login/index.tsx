import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { login, type LoginPayload } from '../../api/auth';
import GisGlobe from '../../components/GisGlobe';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const from = (location.state as { from?: string } | null)?.from || '/projects';

  const loginMutation = useMutation({
    mutationFn: (values: LoginPayload) => login(values),
    onSuccess: (result) => {
      setAuth(result);
      message.success('登录成功');
      navigate(from, { replace: true });
    },
    onError: (error) => message.error((error as Error).message || '登录失败')
  });

  if (token) return <Navigate to="/projects" replace />;

  return (
    <div className="login-shell">
      <section className="brand-panel">
        <GisGlobe interactivity={0.55} />
        <div className="brand-overlay">
          <span className="brand-pulse">AI 知识引擎就绪</span>
          <Typography.Title level={1}>GIS 解决方案 AI 平台</Typography.Title>
          <Typography.Text>Powered by IMA · DeepSeek · Local PostGIS</Typography.Text>
          <div className="brand-metrics">
            <strong>10+</strong><span>行业模板</span>
            <strong>12</strong><span>Skill 组件</span>
            <strong>100%</strong><span>本地运行</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <Typography.Text className="gis-section-kicker">SECURE ACCESS</Typography.Text>
          <Typography.Title level={2}>登录工作台</Typography.Title>
          <Typography.Text type="secondary">使用本地账号进入 GIS 解决方案编排平台。</Typography.Text>
          <Form layout="vertical" initialValues={{ username: 'admin', password: 'admin123' }} onFinish={(values) => loginMutation.mutate(values)}>
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} size="large" placeholder="admin" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} size="large" placeholder="admin123" />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loginMutation.isPending}>
              进入平台
            </Button>
          </Form>
        </div>
      </section>
    </div>
  );
}