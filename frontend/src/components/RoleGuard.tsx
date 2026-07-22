import { Result } from 'antd';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface RoleGuardProps {
  allow: string[];
  children: ReactNode;
}

export default function RoleGuard({ allow, children }: RoleGuardProps) {
  const role = useAuthStore((state) => state.role || 'USER');

  if (!allow.includes(role)) {
    return (
      <Result
        status="403"
        title="暂无访问权限"
        subTitle="用户权限页面仅 ADMIN 可访问，请联系管理员调整角色。"
      />
    );
  }

  return <>{children}</>;
}
