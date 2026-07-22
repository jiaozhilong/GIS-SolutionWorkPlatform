import { Button, Empty, Result, Skeleton } from 'antd';
import type { ReactNode } from 'react';

interface AsyncStateProps {
  loading: boolean;
  error?: unknown;
  empty?: boolean;
  emptyDescription?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export default function AsyncState({ loading, error, empty, emptyDescription = '暂无数据', onRetry, children }: AsyncStateProps) {
  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  if (error) {
    return (
      <Result
        status="error"
        title="数据加载失败"
        subTitle={(error as Error).message || '请稍后重试'}
        extra={onRetry ? <Button onClick={onRetry}>重试</Button> : undefined}
      />
    );
  }

  if (empty) return <Empty description={emptyDescription} />;
  return children;
}
