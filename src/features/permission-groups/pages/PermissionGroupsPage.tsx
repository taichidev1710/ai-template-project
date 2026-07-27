import { useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useAuthStore } from '@/shared/stores/auth-store';
import { usePermissionGroups, usePermissionGroupMutations } from '../hooks/use-permission-groups';
import { GroupsTable } from '../components/GroupsTable';
import { GroupsGrid } from '../components/GroupsGrid';
import { GroupDetailModal } from '../components/GroupDetailModal';
import { GroupFormModal } from '../components/GroupFormModal';
import type { PermissionGroup, PermissionGroupInput } from '../types';

type ViewMode = 'table' | 'grid';

export function PermissionGroupsPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<PermissionGroup | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<PermissionGroup | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = usePermissionGroups({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = usePermissionGroupMutations();

  const canManage = (g: PermissionGroup) =>
    !g.isSystem && (can('group:update') || g.ownerId === currentUserId);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: PermissionGroup) => {
    setDetailOpen(false);
    setEditing(g);
    setFormOpen(true);
  };
  const openDetail = (g: PermissionGroup) => {
    setDetail(g);
    setDetailOpen(true);
  };
  const confirmDelete = (g: PermissionGroup) => {
    modal.confirm({
      title: t('group.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(g.id),
    });
  };

  const onSubmit = (values: PermissionGroupInput) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const viewProps = {
    data: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    loading: isLoading,
    currentUserId,
    canManage,
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
      title={t('group.title')}
      extra={
        can('group:create') && (
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

      {view === 'table' ? <GroupsTable {...viewProps} /> : <GroupsGrid {...viewProps} />}

      <GroupDetailModal
        open={detailOpen}
        group={detail}
        currentUserId={currentUserId}
        canManage={canManage}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <GroupFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
