import { Button, Result, Space, Typography } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error?: Error;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('GeoAgent render error captured by AppErrorBoundary', error, info.componentStack);
  }

  private recover = () => {
    this.setState({ error: undefined });
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-boundary" role="alert">
        <Result
          status="error"
          title="页面暂时无法显示"
          subTitle="渲染过程中出现异常，工作数据不会因此丢失。你可以返回工作台或重新加载。"
          extra={(
            <Space wrap>
              <Button type="primary" onClick={this.recover}>返回工作台</Button>
              <Button onClick={() => window.location.reload()}>重新加载</Button>
            </Space>
          )}
        >
          <Typography.Text type="secondary">错误信息：{this.state.error.message}</Typography.Text>
        </Result>
      </main>
    );
  }
}
