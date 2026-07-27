import { useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Switch, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCan } from '@/shared/lib/can';
import { QueryError } from '@/shared/ui/QueryError';
import { useFeatures, useFeatureMutations } from '../hooks/use-features';
import { FeatureFormModal } from '../components/FeatureFormModal';
import type { FeatureItem, FeatureInput } from '../types';

export function FeatureRegistryPage() {
  const { t } = useTranslation();
  const can = useCan();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<FeatureItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useFeatures({
    page,
    limit: 10,
    search: search || undefined,
  });
  const { create, update, remove } = useFeatureMutations();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (f: FeatureItem) => {
    setEditing(f);
    setModalOpen(true);
  };

  const onSubmit = (values: FeatureInput) => {
    const done = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const columns = [
    { title: t('feature.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('feature.key'),
      dataIndex: 'key',
      key: 'key',
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: t('feature.actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: (actions: FeatureItem['actions']) => (
        <Space size={4} wrap>
          {actions.map((a) => (
            <Tag key={a.key}>{a.key}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('feature.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 110,
      render: (enabled: boolean, f: FeatureItem) => (
        <Switch
          checked={enabled}
          disabled={f.isSystem || !can('feature:update')}
          onChange={(checked) => update.mutate({ id: f.id, input: { enabled: checked } })}
        />
      ),
    },
    {
      title: t('feature.system'),
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="blue">{t('feature.system')}</Tag> : null),
    },
    {
      title: t('common.actions'),
      key: 'rowActions',
      width: 160,
      render: (_: unknown, f: FeatureItem) => (
        <Space>
          {can('feature:update') && !f.isSystem && (
            <Button size="small" onClick={() => openEdit(f)}>
              {t('action.edit')}
            </Button>
          )}
          {can('feature:delete') && !f.isSystem && (
            <Popconfirm
              title={t('feature.deleteConfirm')}
              onConfirm={() => remove.mutate(f.id)}
              okText={t('action.delete')}
              cancelText={t('action.cancel')}
            >
              <Button size="small" danger>
                {t('action.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          {t('feature.title')}
        </Typography.Title>
        {can('feature:create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('action.create')}
          </Button>
        )}
      </div>
      <Card>
        {isError && <QueryError error={error} onRetry={() => refetch()} />}
        <Input.Search
          allowClear
          placeholder={t('action.search')}
          className="mb-4 max-w-xs"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Table<FeatureItem>
          rowKey="id"
          scroll={{ x: 'max-content' }}
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: t('empty') }}
          pagination={{ current: page, pageSize: 10, total: data?.total ?? 0, onChange: setPage }}
        />
      </Card>
      <FeatureFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
