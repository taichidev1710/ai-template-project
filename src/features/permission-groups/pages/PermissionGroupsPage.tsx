import { useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCan } from '@/shared/lib/can';
import { QueryError } from '@/shared/ui/QueryError';
import { useAuthStore } from '@/shared/stores/auth-store';
import { usePermissionGroups, usePermissionGroupMutations } from '../hooks/use-permission-groups';
import { GroupFormModal } from '../components/GroupFormModal';
import type { PermissionGroup, PermissionGroupInput } from '../types';

export function PermissionGroupsPage() {
  const { t } = useTranslation();
  const can = useCan();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PermissionGroup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = usePermissionGroups({
    page,
    limit: 10,
    search: search || undefined,
  });
  const { create, update, remove } = usePermissionGroupMutations();

  const canEdit = (g: PermissionGroup) =>
    !g.isSystem && (can('group:update') || g.ownerId === currentUserId);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (g: PermissionGroup) => {
    setEditing(g);
    setModalOpen(true);
  };

  const onSubmit = (values: PermissionGroupInput) => {
    const done = () => setModalOpen(false);
    if (editing) update.mutate({ id: editing.id, input: values }, { onSuccess: done });
    else create.mutate(values, { onSuccess: done });
  };

  const columns = [
    { title: t('group.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('group.key'),
      dataIndex: 'key',
      key: 'key',
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    {
      title: t('group.grants'),
      dataIndex: 'grants',
      key: 'grants',
      render: (grants: string[]) => <Tag>{grants.length}</Tag>,
    },
    {
      title: t('group.owner'),
      key: 'owner',
      render: (_: unknown, g: PermissionGroup) =>
        g.ownerId === null ? (
          <Tag color="gold">{t('group.global')}</Tag>
        ) : g.ownerId === currentUserId ? (
          <Tag color="green">{t('group.mine')}</Tag>
        ) : (
          <Tag>—</Tag>
        ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 160,
      render: (_: unknown, g: PermissionGroup) => (
        <Space>
          {canEdit(g) && (
            <Button size="small" onClick={() => openEdit(g)}>
              {t('action.edit')}
            </Button>
          )}
          {canEdit(g) && (
            <Popconfirm
              title={t('group.deleteConfirm')}
              onConfirm={() => remove.mutate(g.id)}
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
          {t('group.title')}
        </Typography.Title>
        {can('group:create') && (
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
        <Table<PermissionGroup>
          rowKey="id"
          scroll={{ x: 'max-content' }}
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: t('empty') }}
          pagination={{ current: page, pageSize: 10, total: data?.total ?? 0, onChange: setPage }}
        />
      </Card>
      <GroupFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
