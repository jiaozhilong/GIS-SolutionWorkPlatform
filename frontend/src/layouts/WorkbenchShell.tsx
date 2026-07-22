import { BellOutlined, DownOutlined, LogoutOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { AutoComplete, Avatar, Badge, Button, Dropdown, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { onPreviewWrite, PREVIEW_WRITE_MESSAGE } from '../api/runtimeMode';
import GisSidebar from '../components/GisSidebar';
import { getVisibleNavigationItems, navigationItems } from '../config/navigation';
import { useAuthStore } from '../stores/authStore';

export default function WorkbenchShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const username = useAuthStore((state) => state.realName || state.username || 'admin');
  const role = useAuthStore((state) => state.role || 'USER');
  const runtimeMode = useAuthStore((state) => state.runtimeMode);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => onPreviewWrite(() => message.warning(PREVIEW_WRITE_MESSAGE)), []);

  const logout = () => {
    queryClient.clear();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const visibleNavItems = useMemo(() => getVisibleNavigationItems(role), [role]);
  const activeItem = useMemo(() => {
    return (
      navigationItems
        .filter((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
        .sort((a, b) => b.path.length - a.path.length)[0] || navigationItems[0]
    );
  }, [location.pathname]);
  const searchOptions = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return visibleNavItems
      .filter((item) => {
        if (!keyword) return true;
        return [item.label, item.description, ...item.keywords].some((text) => text.toLowerCase().includes(keyword));
      })
      .map((item) => ({
        value: item.path,
        label: (
          <div className="gis-search-option">
            <span>{item.icon}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </div>
          </div>
        )
      }));
  }, [searchValue, visibleNavItems]);
  const userMenu: MenuProps['items'] = [
    {
      key: 'current-user',
      disabled: true,
      label: (
        <div className="gis-user-menu__summary">
          <strong>{username}</strong>
          <span>{runtimeMode === 'PREVIEW' ? '本地预览' : role}</span>
        </div>
      )
    },
    { type: 'divider' },
    { key: 'logout', danger: true, icon: <LogoutOutlined />, label: '退出登录', onClick: logout }
  ];

  const handleSearchSubmit = (value: string) => {
    const keyword = value.trim();
    if (!keyword) return;
    const directMatch = visibleNavItems.find((item) => item.path === keyword);
    if (directMatch) {
      navigate(directMatch.path);
      setSearchValue('');
      return;
    }
    const fuzzyMatch = visibleNavItems.find((item) =>
      [item.label, item.description, ...item.keywords].some((text) => text.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (fuzzyMatch) {
      navigate(fuzzyMatch.path);
      setSearchValue('');
      return;
    }
    message.info('搜索能力建设中：当前仅支持页面路由内搜索。');
  };

  return (
    <div className={`gis-app-shell${collapsed ? ' is-sidebar-collapsed' : ''}`}>
      <GisSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className="gis-main">
        <header className="gis-topbar">
          <div className="gis-topbar__search">
            <AutoComplete
              value={searchValue}
              options={searchOptions}
              onSearch={setSearchValue}
              onSelect={(path) => {
                navigate(path);
                setSearchValue('');
              }}
              className="gis-global-search"
            >
              <input
                aria-label="全局搜索"
                className="gis-global-search__input"
                placeholder="搜索项目、客户、文档、案例、技能..."
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearchSubmit(searchValue);
                }}
              />
            </AutoComplete>
            <SearchOutlined className="gis-global-search__icon" />
          </div>

          <div className="gis-topbar__context" aria-label="当前页面">
            <Typography.Text className="gis-topbar-kicker">GEOAGENT SOLUTION WORKSPACE</Typography.Text>
            <span>{activeItem.label}</span>
          </div>

          <Space size={10} className="gis-topbar__actions">
            <Badge dot offset={[-4, 4]}>
              <Button aria-label="运行通知" icon={<BellOutlined />} />
            </Badge>
            {runtimeMode === 'PREVIEW' && (
              <Tag color="gold" className="gis-preview-tag">
                本地预览
              </Tag>
            )}
            <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
              <Button className="gis-user-trigger">
                <Avatar size={24} icon={<UserOutlined />} />
                <span className="gis-user-trigger__text">
                  <strong>{username}</strong>
                  <small>{role}</small>
                </span>
                <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </header>

        <section className="gis-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
