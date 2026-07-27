import { useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useFeatures, useFeatureMutations } from '../hooks/use-features';
import { FeaturesTable } from '../components/FeaturesTable';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { FeatureDetailModal } from '../components/FeatureDetailModal';
import { FeatureFormModal } from '../components/FeatureFormModal';
import type { FeatureItem, FeatureInput } from '../types';

type ViewMode = 'table' | 'grid';

export function FeatureRegistryPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<FeatureItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<FeatureItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canUpdate = can(PERM.feature.update);
  const canDelete = can(PERM.feature.delete);

  const { data, isLoading, isError, error, refetch } = useFeatures({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = useFeatureMutations();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (f: FeatureItem) => {
    setDetailOpen(false);
    setEditing(f);
    setFormOpen(true);
  };
  const openDetail = (f: FeatureItem) => {
    setDetail(f);
    setDetailOpen(true);
  };
  const confirmDelete = (f: FeatureItem) => {
    modal.confirm({
      title: t('feature.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(f.id),
    });
  };
  const onToggleEnabled = (f: FeatureItem, enabled: boolean) =>
    update.mutate({ id: f.id, input: { enabled } });

  const onSubmit = (values: FeatureInput) => {
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
    onToggleEnabled,
  };

  return (
    <PageContainer
      title={t('feature.title')}
      extra={
        can(PERM.feature.create) && (
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

      {view === 'table' ? <FeaturesTable {...viewProps} /> : <FeaturesGrid {...viewProps} />}

      <FeatureDetailModal
        open={detailOpen}
        feature={detail}
        canUpdate={canUpdate}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <FeatureFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
