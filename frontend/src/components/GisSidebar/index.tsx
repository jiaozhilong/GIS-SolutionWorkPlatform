import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { NavLink } from 'react-router-dom';
import { getVisibleNavigationItems } from '../../config/navigation';
import { useAuthStore } from '../../stores/authStore';

interface GisSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export default function GisSidebar({ collapsed, onCollapsedChange }: GisSidebarProps) {
  const role = useAuthStore((state) => state.role);
  const visibleNavItems = getVisibleNavigationItems(role);
  const toggleCollapsed = () => onCollapsedChange(!collapsed);

  return (
    <aside className={`gis-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="gis-brand">
        <span className="gis-brand__mark">GA</span>
        <div className="gis-brand__text">
          <strong>GeoAgent Solution Workspace</strong>
          <span>GIS 解决方案智能工作台</span>
        </div>
      </div>

      <nav className="gis-nav" aria-label="主导航">
        {visibleNavItems.map((item) => (
          <Tooltip key={item.path} title={collapsed ? item.label : undefined} placement="right">
            <NavLink
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => `gis-nav__item${isActive ? ' is-active' : ''}`}
            >
              <span className="gis-nav__icon">{item.icon}</span>
              <span className="gis-nav__text">{item.label}</span>
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <div className="gis-sidebar__footer">
        <span>From Requirements to GIS Deliverables</span>
        <strong>从客户需求到方案交付</strong>
      </div>

      <Button
        className="gis-sidebar__collapse"
        type="text"
        aria-expanded={!collapsed}
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={(event) => {
          if (event.detail === 0) toggleCollapsed();
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleCollapsed();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleCollapsed();
          }
        }}
      >
        <span>{collapsed ? '展开菜单' : '收起菜单'}</span>
      </Button>
    </aside>
  );
}
