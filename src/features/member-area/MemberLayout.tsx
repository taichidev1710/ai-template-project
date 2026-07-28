import { Layout, Menu, Space, Button, Dropdown, Avatar, Tag, Grid } from 'antd';
import {
  HomeOutlined,
  IdcardOutlined,
  GiftOutlined,
  BulbOutlined,
  TranslationOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useLogout } from '@/features/auth';
import { useThemeStore } from '@/shared/theme';
import { paths } from '@/app/router/paths';

const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

export function MemberLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const screens = useBreakpoint();

  const items = [
    { key: paths.app.home, icon: <HomeOutlined />, label: t('memberArea.home') },
    { key: paths.app.profile, icon: <IdcardOutlined />, label: t('memberArea.profile') },
    { key: paths.app.perks, icon: <GiftOutlined />, label: t('memberArea.perks') },
  ];

  const selectedKey =
    items
      .map((m) => m.key)
      .filter((k) => location.pathname === k || location.pathname.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0] ?? paths.app.home;

  const toggleLang = () => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');

  return (
    <Layout className="h-screen">
      <Header className="flex items-center gap-4 !px-4">
        <div className="font-semibold text-ink">{t('memberArea.brand')}</div>
        <Menu
          mode="horizontal"
          className="min-w-0 flex-1 border-0 bg-transparent"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
        <Space>
          {user?.tier && (
            <Tag color={user.tier.color || 'blue'} className="hidden sm:inline-flex">
              {user.tier.name}
            </Tag>
          )}
          <Button
            type="text"
            aria-label="Toggle language"
            icon={<TranslationOutlined />}
            onClick={toggleLang}
          />
          <Button
            type="text"
            aria-label="Toggle theme"
            icon={<BulbOutlined />}
            onClick={toggleMode}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t('action.logout'),
                  onClick: () => logout.mutate(),
                },
              ],
            }}
          >
            <Space className="cursor-pointer">
              <Avatar size="small">{user?.name?.[0] ?? 'U'}</Avatar>
              {screens.sm && <span>{user?.name ?? 'User'}</span>}
            </Space>
          </Dropdown>
        </Space>
      </Header>
      <Content className="overflow-auto bg-canvas p-4 sm:p-6">
        <Outlet />
      </Content>
    </Layout>
  );
}
