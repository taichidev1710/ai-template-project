import { useMemo, useState } from 'react';
import { Button, Card, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCan } from '@/shared/lib/can';
import { useRoles } from '@/features/roles';
import type { UserStatus } from '@/shared/stores/auth-store';
import { useUsers, useUserMutations } from '../hooks/use-users';
import { UserFormModal } from '../components/UserFormModal';
import { AssignAccessModal } from '../components/AssignAccessModal';
import type { User, UserInput } from '../types';

const STATUS_COLOR: Record<UserStatus, string> = {
  pending: 'orange',
  active: 'green',
  rejected: 'red',
  disabled: 'default',
};

export function UsersPage() {
  const { t } = useTranslation();
  const can = useCan();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<User | null>(null);

  const { data, isLoading } = useUsers({ page, limit: 10, search: search || undefined });
  const { data: roles } = useRoles({ limit: 100 });
  const { create, remove, setStatus } = useUserMutations();

  const roleName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles?.items ?? []) map.set(r.id, r.name);
    return map;
  }, [roles]);

  const canAssign = can('user:assign_role') || can('group:assign');

  const onCreate = (values: UserInput) =>
    create.mutate(values, { onSuccess: () => setCreateOpen(false) });

  const columns = [
    { title: t('user.name'), dataIndex: 'name', key: 'name' },
    { title: t('user.email'), dataIndex: 'email', key: 'email' },
    {
      title: t('user.role'),
      dataIndex: 'roleIds',
      key: 'roleIds',
      render: (ids: string[]) => (
        <Space size={4} wrap>
          {ids.map((id) => (
            <Tag key={id}>{roleName.get(id) ?? id.slice(-4)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('profile.field.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: UserStatus) => <Tag color={STATUS_COLOR[status]}>{t(`status.${status}`)}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 260,
      render: (_: unknown, user: User) => (
        <Space wrap>
          {canAssign && (
            <Button size="small" icon={<SafetyOutlined />} onClick={() => setAssignFor(user)}>
              {t('action.assign')}
            </Button>
          )}
          {can('account:approve') && user.status === 'active' && (
            <Button size="small" onClick={() => setStatus.mutate({ id: user.id, status: 'disabled' })}>
              {t('action.disable')}
            </Button>
          )}
          {can('account:approve') && user.status === 'disabled' && (
            <Button size="small" onClick={() => setStatus.mutate({ id: user.id, status: 'active' })}>
              {t('action.enable')}
            </Button>
          )}
          {can('user:delete') && (
            <Popconfirm
              title={t('user.deleteConfirm')}
              onConfirm={() => remove.mutate(user.id)}
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
          {t('nav.users')}
        </Typography.Title>
        {can('user:create') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
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
        <Table<User>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: t('empty') }}
          pagination={{ current: page, pageSize: 10, total: data?.total ?? 0, onChange: setPage }}
        />
      </Card>
      <UserFormModal
        open={createOpen}
        confirmLoading={create.isPending}
        onSubmit={onCreate}
        onCancel={() => setCreateOpen(false)}
      />
      <AssignAccessModal user={assignFor} open={Boolean(assignFor)} onClose={() => setAssignFor(null)} />
    </div>
  );
}
