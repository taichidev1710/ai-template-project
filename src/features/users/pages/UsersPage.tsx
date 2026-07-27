import { useMemo, useState } from 'react';
import { App, Button, Input, Segmented, Select, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { USER_STATUSES, type UserStatus } from '@/shared/stores/auth-store';
import { useRoles } from '@/features/roles';
import { useUsers, useUserMutations } from '../hooks/use-users';
import { UsersTable } from '../components/UsersTable';
import { UsersGrid } from '../components/UsersGrid';
import { UserDetailModal } from '../components/UserDetailModal';
import { UserFormModal } from '../components/UserFormModal';
import { AssignAccessModal } from '../components/AssignAccessModal';
import type { User, UserInput } from '../types';

type ViewMode = 'table' | 'grid';

export function UsersPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<User | null>(null);
  const [detail, setDetail] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canAssign = can('user:assign_role') || can('group:assign');
  const canManageStatus = can('account:approve');
  const canDelete = can('user:delete');

  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    limit: pageSize,
    search: search || undefined,
    status,
  });
  const { data: roles } = useRoles({ limit: 100 });
  const { create, remove, setStatus: setUserStatus } = useUserMutations();

  const roleName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles?.items ?? []) map.set(r.id, r.name);
    return map;
  }, [roles]);

  const openDetail = (user: User) => {
    setDetail(user);
    setDetailOpen(true);
  };
  const openAssign = (user: User) => {
    setDetailOpen(false);
    setAssignFor(user);
  };
  const toggleStatus = (user: User) =>
    setUserStatus.mutate({ id: user.id, status: user.status === 'active' ? 'disabled' : 'active' });
  const confirmDelete = (user: User) => {
    modal.confirm({
      title: t('user.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(user.id),
    });
  };
  const onCreate = (values: UserInput) =>
    create.mutate(values, { onSuccess: () => setCreateOpen(false) });

  const viewProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isLoading,
    roleName,
    canAssign,
    canManageStatus,
    canDelete,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onView: openDetail,
    onAssign: openAssign,
    onToggleStatus: toggleStatus,
    onDelete: confirmDelete,
  };

  return (
    <PageContainer
      title={t('nav.users')}
      extra={
        can('user:create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('action.create')}
          </Button>
        )
      }
    >
      {isError && <QueryError error={error} onRetry={() => refetch()} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input
            allowClear
            placeholder={t('action.search')}
            className="w-56"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
          <Select<UserStatus>
            allowClear
            placeholder={t('profile.field.status')}
            className="w-40"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={USER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
          />
        </Space>
        <Segmented<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, title: t('view.table') },
            { value: 'grid', icon: <AppstoreOutlined />, title: t('view.grid') },
          ]}
        />
      </div>

      {view === 'table' ? <UsersTable {...viewProps} /> : <UsersGrid {...viewProps} />}

      <UserDetailModal
        open={detailOpen}
        user={detail}
        roleName={roleName}
        canAssign={canAssign}
        onAssign={openAssign}
        onClose={() => setDetailOpen(false)}
      />
      <UserFormModal
        open={createOpen}
        confirmLoading={create.isPending}
        onSubmit={onCreate}
        onCancel={() => setCreateOpen(false)}
      />
      <AssignAccessModal
        user={assignFor}
        open={Boolean(assignFor)}
        onClose={() => setAssignFor(null)}
      />
    </PageContainer>
  );
}
