import { useState } from 'react';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Drawer, Grid } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  LogoutOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/shared/stores/ui-store';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useThemeStore } from '@/shared/theme';
import { paths } from '@/app/router/paths';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const mode = useThemeStore((s) => s.mode);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

  // < lg (992px): phone + small tablet → nav là Drawer overlay, không chiếm chỗ.
  // >= lg: desktop/large screen → Sider inline thu gọn được.
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const menuItems = [
    { key: paths.dashboard, icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: paths.users, icon: <TeamOutlined />, label: t('nav.users') },
    { key: paths.profile, icon: <IdcardOutlined />, label: t('nav.profile') },
    { key: paths.diagrams, icon: <PartitionOutlined />, label: 'Sơ đồ' },
    { key: paths.diagramTypes, icon: <ApartmentOutlined />, label: 'Loại sơ đồ' },
  ];

  const toggleLang = () => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');

  // Highlight the nav item whose route prefixes the current path (so nested
  // pages like /diagram-types/:id still light up their parent).
  const selectedKey =
    menuItems
      .map((m) => m.key)
      .filter((k) => location.pathname === k || location.pathname.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname;

  const brand = (full: boolean) => (
    <div className="flex h-14 items-center justify-center font-semibold text-ink">
      {full ? t('app.name') : 'AD'}
    </div>
  );

  const nav = (
    <Menu
      theme={mode === 'dark' ? 'dark' : 'light'}
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        setMobileNavOpen(false); // close the drawer after picking a route on mobile
      }}
    />
  );

  const onToggleNav = () => (isMobile ? setMobileNavOpen(true) : toggleSidebar());

  return (
    <Layout className="h-screen">
      {isMobile ? (
        <Drawer
          placement="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          size={240}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          {brand(true)}
          {nav}
        </Drawer>
      ) : (
        <Sider trigger={null} collapsible collapsed={collapsed}>
          {brand(!collapsed)}
          {nav}
        </Sider>
      )}
      <Layout>
        <Header className="flex items-center justify-between !px-4">
          <Button
            type="text"
            aria-label="Toggle sidebar"
            icon={!isMobile && !collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={onToggleNav}
          />
          <Space>
            <Button type="text" aria-label="Toggle language" icon={<TranslationOutlined />} onClick={toggleLang} />
            <Button type="text" aria-label="Toggle theme" icon={<BulbOutlined />} onClick={toggleMode} />
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: t('action.logout'),
                    onClick: () => {
                      clearAuth();
                      navigate(paths.login);
                    },
                  },
                ],
              }}
            >
              <Space className="cursor-pointer">
                <Avatar size="small">{user?.name?.[0] ?? 'U'}</Avatar>
                <span className="hidden sm:inline">{user?.name ?? 'User'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="overflow-auto bg-canvas">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
