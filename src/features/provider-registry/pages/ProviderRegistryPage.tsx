import { useState } from 'react';
import { App, Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/shared/ui';
import { QueryError } from '@/shared/ui/QueryError';
import { useCan } from '@/shared/lib/can';
import { PERM } from '@/shared/authz/permissions';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useProviders, useProviderMutations } from '../hooks/use-providers';
import { ProvidersTable } from '../components/ProvidersTable';
import { ProviderFormModal } from '../components/ProviderFormModal';
import type { ProviderItem, ProviderInput } from '../types';

export function ProviderRegistryPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const can = useCan();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<ProviderItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canUpdate = can(PERM.provider.update);
  const canDelete = can(PERM.provider.delete);

  const { data, isLoading, isError, error, refetch } = useProviders({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const { create, update, remove } = useProviderMutations();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: ProviderItem) => {
    setEditing(p);
    setFormOpen(true);
  };
  const confirmDelete = (p: ProviderItem) => {
    modal.confirm({
      title: t('provider.deleteConfirm'),
      okText: t('action.delete'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: () => remove.mutateAsync(p.id),
    });
  };
  const onToggleEnabled = (p: ProviderItem, enabled: boolean) =>
    update.mutate({ id: p.id, input: { enabled } });

  const onSubmit = (values: ProviderInput) => {
    const done = () => setFormOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  return (
    <PageContainer
      title={t('provider.title')}
      extra={
        can(PERM.provider.create) && (
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
      </div>

      <ProvidersTable
        data={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        loading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        onEdit={openEdit}
        onDelete={confirmDelete}
        onToggleEnabled={onToggleEnabled}
      />

      <ProviderFormModal
        open={formOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setFormOpen(false)}
      />
    </PageContainer>
  );
}
