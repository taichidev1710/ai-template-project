import { Layout, Menu, Button, Space, Dropdown, Avatar } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  IdcardOutlined,
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

  const menuItems = [
    { key: paths.dashboard, icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: paths.users, icon: <TeamOutlined />, label: t('nav.users') },
    { key: paths.profile, icon: <IdcardOutlined />, label: t('nav.profile') },
  ];

  const toggleLang = () => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');

  return (
    <Layout className="h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="flex h-14 items-center justify-center font-semibold text-ink">
          {collapsed ? 'AD' : t('app.name')}
        </div>
        <Menu
          theme={mode === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between !px-4">
          <Button
            type="text"
            aria-label="Toggle sidebar"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
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
