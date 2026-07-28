import { useMemo, useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useMemberGroups } from '@/features/member-groups';
import { useTiers, useTierMutations } from '../hooks/use-tiers';
import { TiersTable } from '../components/TiersTable';
import { TiersGrid } from '../components/TiersGrid';
import { TierDetailModal } from '../components/TierDetailModal';
import { TierFormModal } from '../components/TierFormModal';
import type { TierItem, TierInput } from '../types';

type ViewMode = 'table' | 'grid';

export function TiersPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<TierItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<TierItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canUpdate = can(PERM.tier.update);
  const canDelete = can(PERM.tier.delete);

  const { data, isLoading, isError, error, refetch } = useTiers({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { data: groups } = useMemberGroups({ limit: 100 });
  const { create, update, remove } = useTierMutations();

  const groupName = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups?.items ?? []) map.set(g.id, g.name);
    return map;
  }, [groups]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (tier: TierItem) => {
    setDetailOpen(false);
    setEditing(tier);
    setFormOpen(true);
  };
  const openDetail = (tier: TierItem) => {
    setDetail(tier);
    setDetailOpen(true);
  };
  const confirmDelete = (tier: TierItem) => {
    modal.confirm({
      title: t('tier.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(tier.id),
    });
  };

  const onSubmit = (values: TierInput) => {
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
      title={t('tier.title')}
      extra={
        can(PERM.tier.create) && (
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

      {view === 'table' ? <TiersTable {...viewProps} /> : <TiersGrid {...viewProps} />}

      <TierDetailModal
        open={detailOpen}
        tier={detail}
        groupName={groupName}
        canUpdate={canUpdate}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <TierFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
