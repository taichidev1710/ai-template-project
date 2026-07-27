import { useState } from 'react';
import { App, Button, Card, Form, Input, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { QueryError } from '@/shared/ui/QueryError';
import { usePendingAccounts, useAccountDecisions } from '../hooks/use-accounts';
import { ApprovalHistoryModal } from '../components/ApprovalHistoryModal';
import type { AccountUser } from '../types';

export function AccountsPage() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  const params = { page, limit: 10, search: search || undefined };
  const { data, isLoading, isError, error, refetch } = usePendingAccounts(params);
  const { approve, reject } = useAccountDecisions();

  const openReject = (user: AccountUser) => {
    let reason = '';
    modal.confirm({
      title: t('account.rejectTitle'),
      content: (
        <Form layout="vertical" className="mt-2">
          <Form.Item label={t('account.rejectReason')} required>
            <Input.TextArea rows={3} onChange={(e) => (reason = e.target.value)} />
          </Form.Item>
        </Form>
      ),
      okText: t('action.reject'),
      okButtonProps: { danger: true },
      cancelText: t('action.cancel'),
      onOk: async () => {
        if (!reason.trim()) return Promise.reject(new Error('reason required'));
        await reject.mutateAsync({ id: user.id, reason: reason.trim() });
      },
    });
  };

  const columns = [
    { title: t('register.name'), dataIndex: 'name', key: 'name' },
    { title: t('register.email'), dataIndex: 'email', key: 'email' },
    {
      title: t('user.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, user: AccountUser) => (
        <Space>
          <Popconfirm
            title={t('account.approveConfirm')}
            onConfirm={() => approve.mutate(user.id)}
            okText={t('action.approve')}
            cancelText={t('action.cancel')}
          >
            <Button type="primary" size="small" loading={approve.isPending}>
              {t('action.approve')}
            </Button>
          </Popconfirm>
          <Button danger size="small" onClick={() => openReject(user)}>
            {t('action.reject')}
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryFor(user.id)}
            aria-label={t('action.history')}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Typography.Title level={4}>
        {t('account.queueTitle')} <Tag color="orange">{data?.total ?? 0}</Tag>
      </Typography.Title>
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
        <Table<AccountUser>
          rowKey="id"
          scroll={{ x: 'max-content' }}
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          locale={{ emptyText: t('empty') }}
          pagination={{
            current: page,
            pageSize: 10,
            total: data?.total ?? 0,
            onChange: setPage,
          }}
        />
      </Card>
      <ApprovalHistoryModal
        userId={historyFor}
        open={Boolean(historyFor)}
        onClose={() => setHistoryFor(null)}
      />
    </div>
  );
}
