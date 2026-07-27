import { useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCan } from '@/shared/lib/can';
import { useRoles, useRoleMutations } from '../hooks/use-roles';
import { RoleFormModal } from '../components/RoleFormModal';
import type { Role, RoleInput } from '../types';

export function RolesPage() {
  const { t } = useTranslation();
  const can = useCan();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useRoles({ page, limit: 10, search: search || undefined });
  const { create, update, remove } = useRoleMutations();

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditing(role);
    setModalOpen(true);
  };

  const onSubmit = (values: RoleInput) => {
    const done = () => setModalOpen(false);
    if (editing) {
      // System roles: only name/description are editable server-side
      const patch = editing.isSystem
        ? { name: values.name, description: values.description }
        : values;
      update.mutate({ id: editing.id, input: patch }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  };

  const columns = [
    { title: t('role.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('role.key'),
      dataIndex: 'key',
      key: 'key',
      render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
    },
    { title: t('role.level'), dataIndex: 'level', key: 'level', width: 90 },
    {
      title: t('role.permissions'),
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[]) => <Tag>{perms.includes('*') ? '*' : perms.length}</Tag>,
    },
    {
      title: t('role.system'),
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="blue">{t('role.system')}</Tag> : null),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 160,
      render: (_: unknown, role: Role) => (
        <Space>
          {can('role:update') && (
            <Button size="small" onClick={() => openEdit(role)}>
              {t('action.edit')}
            </Button>
          )}
          {can('role:delete') && !role.isSystem && (
            <Popconfirm
              title={t('role.deleteConfirm')}
              onConfirm={() => remove.mutate(role.id)}
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
          {t('role.title')}
        </Typography.Title>
        {can('role:create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('action.create')}
          </Button>
        )}
      </div>
      <Card>
        <Input.Search
          allowClear
          placeholder={t('action.search')}
          className="mb-4 max-w-xs"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Table<Role>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: t('empty') }}
          pagination={{ current: page, pageSize: 10, total: data?.total ?? 0, onChange: setPage }}
        />
      </Card>
      <RoleFormModal
        open={modalOpen}
        initialValue={editing}
        confirmLoading={create.isPending || update.isPending}
        onSubmit={onSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}
