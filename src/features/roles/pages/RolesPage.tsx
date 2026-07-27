import { useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useRoles, useRoleMutations } from '../hooks/use-roles';
import { RolesTable } from '../components/RolesTable';
import { RolesGrid } from '../components/RolesGrid';
import { RoleDetailModal } from '../components/RoleDetailModal';
import { RoleFormModal } from '../components/RoleFormModal';
import type { Role, RoleInput } from '../types';

type ViewMode = 'table' | 'grid';

export function RolesPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<Role | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Role | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canCreate = can('role:create');
  const canEdit = can('role:update');
  const canDelete = can('role:delete');

  const { data, isLoading, isError, error, refetch } = useRoles({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = useRoleMutations();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (role: Role) => {
    setDetailOpen(false);
    setEditing(role);
    setFormOpen(true);
  };
  const openDetail = (role: Role) => {
    setDetail(role);
    setDetailOpen(true);
  };
  const confirmDelete = (role: Role) => {
    modal.confirm({
      title: t('role.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(role.id),
    });
  };

  const onSubmit = (values: RoleInput) => {
    const done = () => setFormOpen(false);
    if (editing) {
      const patch = editing.isSystem
        ? { name: values.name, description: values.description }
        : values;
      update.mutate({ id: editing.id, input: patch }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  };

  const viewProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isLoading,
    canEdit,
    canDelete,
    onPageChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
    onView: openDetail,
    onEdit: openEdit,
    onDelete: confirmDelete,
  };

  return (
    <PageContainer
      title={t('role.title')}
      extra={
        canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('action.create')}
          </Button>
        )
      }
    >
      {isError && <QueryError error={error} onRetry={() => refetch()} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          allowClear
          placeholder={t('action.search')}
          className="max-w-xs"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
        />
        <Segmented<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: 'table', icon: <UnorderedListOutlined />, title: t('view.table') },
            { value: 'grid', icon: <AppstoreOutlined />, title: t('view.grid') },
          ]}
        />
      </div>

      {view === 'table' ? <RolesTable {...viewProps} /> : <RolesGrid {...viewProps} />}

      <RoleDetailModal
        open={detailOpen}
        role={detail}
        canEdit={canEdit}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <RoleFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
