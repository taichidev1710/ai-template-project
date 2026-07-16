import { useState } from 'react';
import { App, Button, Input, Segmented, Select, Space } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { UsersTable } from '../components/UsersTable';
import { UsersGrid } from '../components/UsersGrid';
import { UserDetailModal } from '../components/UserDetailModal';
import { UserFormModal } from '../components/UserFormModal';
import { useUsers, useUserMutations } from '../hooks/use-users';
import type { User, UserInput, UsersViewMode } from '../types';

const ROLE_OPTIONS: User['role'][] = ['admin', 'editor', 'viewer'];

/** Container page: owns list/filter/view/modal state and wires hooks to components. */
export function UsersPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [role, setRole] = useState<User['role'] | undefined>();
  const [view, setView] = useState<UsersViewMode>('table');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [detail, setDetail] = useState<User | null>(null);

  const { data, isFetching } = useUsers({ page, pageSize, search: debouncedSearch, role });
  const { create, update, remove } = useUserMutations();

  const resetPage = () => setPage(1);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (user: User) => {
    setDetail(null);
    setEditing(user);
    setModalOpen(true);
  };

  const handleSubmit = (values: UserInput) => {
    const onDone = () => setModalOpen(false);
    if (editing) {
      update.mutate({ id: editing.id, input: values }, { onSuccess: onDone });
    } else {
      create.mutate(values, { onSuccess: onDone });
    }
  };

  const confirmDelete = (user: User) => {
    modal.confirm({
      title: t('user.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(user.id),
    });
  };

  const listProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isFetching,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onView: setDetail,
    onEdit: openEdit,
    onDelete: confirmDelete,
  };

  return (
    <PageContainer
      title={t('nav.users')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {t('action.create')}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Input.Search
            placeholder={t('action.search')}
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="w-60"
          />
          <Select<User['role']>
            allowClear
            placeholder={t('user.filterRole')}
            value={role}
            onChange={(value) => {
              setRole(value);
              resetPage();
            }}
            className="w-40"
            options={ROLE_OPTIONS.map((value) => ({ value, label: value }))}
          />
        </Space>

        <Segmented<UsersViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, label: t('view.table') },
            { value: 'grid', icon: <AppstoreOutlined />, label: t('view.grid') },
          ]}
        />
      </div>

      {view === 'table' ? <UsersTable {...listProps} /> : <UsersGrid {...listProps} />}

      <UserDetailModal open={Boolean(detail)} user={detail} onEdit={openEdit} onClose={() => setDetail(null)} />

      <UserFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </PageContainer>
  );
}
