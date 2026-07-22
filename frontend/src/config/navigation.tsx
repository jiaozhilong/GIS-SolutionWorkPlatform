import {
  ApiOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  GithubOutlined,
  NodeIndexOutlined,
  ProjectOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export interface NavigationItem {
  path: string;
  icon: ReactNode;
  label: string;
  description: string;
  adminOnly?: boolean;
  keywords: string[];
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    icon: <AppstoreOutlined />,
    label: '平台总览',
    description: 'Mission Overview',
    keywords: ['dashboard', '平台', '总览', '工作台']
  },
  {
    path: '/projects',
    icon: <ProjectOutlined />,
    label: '项目作战室',
    description: 'Project War Room',
    keywords: ['project', '项目', '客户', '作战室']
  },
  {
    path: '/skills',
    icon: <ApiOutlined />,
    label: 'Agent 技能',
    description: 'Agent Skills',
    keywords: ['agent', '技能', 'prompt']
  },
  {
    path: '/flows',
    icon: <NodeIndexOutlined />,
    label: '流程编排',
    description: 'Flow Orchestration',
    keywords: ['flow', '流程', '编排']
  },
  {
    path: '/templates',
    icon: <FileTextOutlined />,
    label: '方案模板',
    description: 'Solution Templates',
    keywords: ['template', '模板', '方案', 'ppt', 'word']
  },
  {
    path: '/logs',
    icon: <FileSearchOutlined />,
    label: '运行日志',
    description: 'Runtime Logs',
    keywords: ['log', '日志', '运行']
  },
  {
    path: '/users',
    icon: <TeamOutlined />,
    label: '用户权限',
    description: 'Users & Access',
    adminOnly: true,
    keywords: ['user', '用户', '权限', 'admin']
  },
  {
    path: '/settings/ima',
    icon: <DatabaseOutlined />,
    label: '知识库 IMA',
    description: 'Knowledge IMA',
    keywords: ['ima', '知识库', '资料库']
  },
  {
    path: '/settings/llm',
    icon: <SettingOutlined />,
    label: '模型配置',
    description: 'Model Settings',
    keywords: ['llm', '模型', '配置']
  },
  {
    path: '/settings/github',
    icon: <GithubOutlined />,
    label: 'GitHub 连接',
    description: 'GitHub Connection',
    keywords: ['github', '连接', '仓库']
  }
];

export function getVisibleNavigationItems(role?: string) {
  return navigationItems.filter((item) => !item.adminOnly || role === 'ADMIN');
}
