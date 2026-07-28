import { useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useMemberGroups, useMemberGroupMutations } from '../hooks/use-member-groups';
import { MemberGroupsTable } from '../components/MemberGroupsTable';
import { MemberGroupsGrid } from '../components/MemberGroupsGrid';
import { MemberGroupDetailModal } from '../components/MemberGroupDetailModal';
import { MemberGroupFormModal } from '../components/MemberGroupFormModal';
import type { MemberGroup, MemberGroupInput } from '../types';

type ViewMode = 'table' | 'grid';

export function MemberGroupsPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<MemberGroup | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<MemberGroup | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canUpdate = can(PERM.memberGroup.update);
  const canDelete = can(PERM.memberGroup.delete);

  const { data, isLoading, isError, error, refetch } = useMemberGroups({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = useMemberGroupMutations();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g: MemberGroup) => {
    setDetailOpen(false);
    setEditing(g);
    setFormOpen(true);
  };
  const openDetail = (g: MemberGroup) => {
    setDetail(g);
    setDetailOpen(true);
  };
  const confirmDelete = (g: MemberGroup) => {
    modal.confirm({
      title: t('memberGroup.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(g.id),
    });
  };

  const onSubmit = (values: MemberGroupInput) => {
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
    canUpdate,
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
      title={t('memberGroup.title')}
      extra={
        can(PERM.memberGroup.create) && (
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

      {view === 'table' ? <MemberGroupsTable {...viewProps} /> : <MemberGroupsGrid {...viewProps} />}

      <MemberGroupDetailModal
        open={detailOpen}
        group={detail}
        canUpdate={canUpdate}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <MemberGroupFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
