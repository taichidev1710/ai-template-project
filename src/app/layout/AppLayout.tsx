import { useState, type ReactNode } from 'react';
import { Layout, Menu, Button, Space, Dropdown, Avatar, Drawer, Grid } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  IdcardOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  AppstoreOutlined,
  CrownOutlined,
  UsergroupAddOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  LogoutOutlined,
  TranslationOutlined,
  VideoCameraOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/shared/stores/ui-store';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useLogout } from '@/features/auth';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
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
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const can = useCan();

  // < lg (992px): phone + small tablet → nav là Drawer overlay, không chiếm chỗ.
  // >= lg: desktop/large screen → Sider inline thu gọn được.
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Menu gom theo "thế giới" (spec §6): mỗi cụm là 1 group, cụm rỗng (không quyền nào)
  // tự ẩn. `perm` gate từng mục (chỉ UX — BE vẫn là hàng rào thật). Mục không perm luôn hiện.
  const menuGroups: Array<{
    key: string;
    label?: string;
    items: Array<{ key: string; icon: ReactNode; label: string; perm?: string }>;
  }> = [
    {
      key: 'grp-overview',
      items: [
        { key: paths.dashboard, icon: <DashboardOutlined />, label: t('nav.dashboard') },
        { key: paths.profile, icon: <IdcardOutlined />, label: t('nav.profile') },
      ],
    },
    {
      key: 'grp-staff',
      label: t('nav.group.staff'),
      items: [
        { key: paths.users, icon: <TeamOutlined />, label: t('nav.users'), perm: PERM.user.read },
        { key: paths.accounts, icon: <AuditOutlined />, label: t('nav.accounts'), perm: PERM.account.read },
        { key: paths.roles, icon: <SafetyCertificateOutlined />, label: t('nav.roles'), perm: PERM.role.read },
        { key: paths.permissionGroups, icon: <KeyOutlined />, label: t('nav.groups'), perm: PERM.group.read },
        { key: paths.features, icon: <AppstoreOutlined />, label: t('nav.features'), perm: PERM.feature.read },
      ],
    },
    {
      key: 'grp-member',
      label: t('nav.group.member'),
      items: [
        { key: paths.members, icon: <UsergroupAddOutlined />, label: t('nav.members'), perm: PERM.member.read },
        { key: paths.tiers, icon: <CrownOutlined />, label: t('nav.tiers'), perm: PERM.tier.read },
        { key: paths.memberGroups, icon: <KeyOutlined />, label: t('nav.memberGroups'), perm: PERM.memberGroup.read },
        { key: paths.memberFeatures, icon: <AppstoreOutlined />, label: t('nav.memberFeatures'), perm: PERM.memberFeature.read },
      ],
    },
    {
      key: 'grp-demo',
      label: t('nav.group.demo'),
      items: [
        { key: paths.diagrams, icon: <PartitionOutlined />, label: 'Sơ đồ' },
        { key: paths.diagramTypes, icon: <ApartmentOutlined />, label: 'Loại sơ đồ' },
        { key: paths.videoStudio, icon: <VideoCameraOutlined />, label: t('nav.videoStudio') },
        { key: paths.providers, icon: <ApiOutlined />, label: t('nav.providers'), perm: PERM.provider.read },
      ],
    },
  ];

  // Lọc mục theo quyền, bỏ cụm rỗng, dựng items cho AntD Menu (type:'group').
  const visibleGroups = menuGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.perm || can(item.perm)) }))
    .filter((g) => g.items.length > 0);

  const menuItems = visibleGroups.map((g) => ({
    key: g.key,
    label: g.label,
    type: 'group' as const,
    children: g.items.map(({ perm: _perm, ...rest }) => rest),
  }));

  // Danh sách phẳng các key lá — cho tính selectedKey.
  const leafKeys = visibleGroups.flatMap((g) => g.items.map((i) => i.key));

  const toggleLang = () => void i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');

  // Highlight the nav item whose route prefixes the current path (so nested
  // pages like /diagram-types/:id still light up their parent).
  const selectedKey =
    leafKeys
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
                    onClick: () => logout.mutate(),
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
