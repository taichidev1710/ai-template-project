import { useState } from 'react';
import { App, Button, Input, Segmented } from 'antd';
import { AppstoreOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useMemberFeatures, useMemberFeatureMutations } from '../hooks/use-member-features';
import { MemberFeaturesTable } from '../components/MemberFeaturesTable';
import { MemberFeaturesGrid } from '../components/MemberFeaturesGrid';
import { MemberFeatureDetailModal } from '../components/MemberFeatureDetailModal';
import { MemberFeatureFormModal } from '../components/MemberFeatureFormModal';
import type { MemberFeatureItem, MemberFeatureInput } from '../types';

type ViewMode = 'table' | 'grid';

export function MemberFeaturesPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [view, setView] = useState<ViewMode>('table');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<MemberFeatureItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<MemberFeatureItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const canUpdate = can(PERM.memberFeature.update);
  const canDelete = can(PERM.memberFeature.delete);

  const { data, isLoading, isError, error, refetch } = useMemberFeatures({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = useMemberFeatureMutations();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (f: MemberFeatureItem) => {
    setDetailOpen(false);
    setEditing(f);
    setFormOpen(true);
  };
  const openDetail = (f: MemberFeatureItem) => {
    setDetail(f);
    setDetailOpen(true);
  };
  const confirmDelete = (f: MemberFeatureItem) => {
    modal.confirm({
      title: t('memberFeature.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(f.id),
    });
  };
  const onToggleEnabled = (f: MemberFeatureItem, enabled: boolean) =>
    update.mutate({ id: f.id, input: { enabled } });

  const onSubmit = (values: MemberFeatureInput) => {
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
      title={t('memberFeature.title')}
      extra={
        can(PERM.memberFeature.create) && (
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

      {view === 'table' ? (
        <MemberFeaturesTable {...viewProps} />
      ) : (
        <MemberFeaturesGrid {...viewProps} />
      )}

      <MemberFeatureDetailModal
        open={detailOpen}
        feature={detail}
        canUpdate={canUpdate}
        onEdit={openEdit}
        onClose={() => setDetailOpen(false)}
      />
      <MemberFeatureFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
