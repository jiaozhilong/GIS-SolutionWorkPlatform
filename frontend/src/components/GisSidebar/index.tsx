import {
  ApiOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  GithubOutlined,
  NodeIndexOutlined,
  ProjectOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: <AppstoreOutlined />, label: '仪表盘' },
  { path: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
  { path: '/skills', icon: <ApiOutlined />, label: '技能管理' },
  { path: '/flows', icon: <NodeIndexOutlined />, label: '流程编排' },
  { path: '/templates', icon: <FileTextOutlined />, label: '模板管理' },
  { path: '/logs', icon: <FileSearchOutlined />, label: '系统日志' },
  { path: '/settings/ima', icon: <DatabaseOutlined />, label: 'IMA 知识库' },
  { path: '/settings/llm', icon: <SettingOutlined />, label: '大模型配置' },
  { path: '/settings/github', icon: <GithubOutlined />, label: 'GitHub 配置' }
];

export default function GisSidebar() {
  return (
    <aside className="gis-sidebar">
      <div className="gis-brand">
        <span className="gis-brand__mark">GIS</span>
        <div>
          <strong>Solution WorkPlatform</strong>
          <span>AI Enabled Geo Workbench</span>
        </div>
      </div>
      <nav className="gis-nav" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `gis-nav__item${isActive ? ' is-active' : ''}`}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="gis-sidebar__footer">
        <span>POSTGIS</span>
        <strong>localhost:5432</strong>
      </div>
    </aside>
  );
}
