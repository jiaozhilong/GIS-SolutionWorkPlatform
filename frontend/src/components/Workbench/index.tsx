import { Card, Progress, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

export interface StatCardItem {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  tone?: 'green' | 'cyan' | 'amber' | 'red' | 'blue';
  progress?: number;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

interface StatGridProps {
  items: StatCardItem[];
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <Typography.Text className="gis-section-kicker">{eyebrow}</Typography.Text>}
        <Typography.Title level={3}>{title}</Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );
}

export function StatGrid({ items }: StatGridProps) {
  return (
    <div className="gis-stat-grid">
      {items.map((item) => (
        <Card key={String(item.label)} className={`gis-stat-card is-${item.tone || 'green'}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.helper && <small>{item.helper}</small>}
          {typeof item.progress === 'number' && <Progress percent={item.progress} showInfo={false} size="small" />}
        </Card>
      ))}
    </div>
  );
}

export function StatusPill({ children, tone = 'green' }: { children: ReactNode; tone?: StatCardItem['tone'] | 'muted' }) {
  return <span className={`gis-status-pill is-${tone}`}>{children}</span>;
}

export function DarkCanvas({ children, title, extra }: { children: ReactNode; title?: ReactNode; extra?: ReactNode }) {
  return (
    <section className="dark-canvas">
      {(title || extra) && (
        <div className="dark-canvas__header">
          <strong>{title}</strong>
          <span>{extra}</span>
        </div>
      )}
      {children}
    </section>
  );
}
