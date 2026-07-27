import { Modal, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useApprovalHistory } from '../hooks/use-accounts';
import type { ApprovalRecord } from '../types';

interface Props {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ApprovalHistoryModal({ userId, open, onClose }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useApprovalHistory(userId ?? '', open && Boolean(userId));

  const columns = [
    {
      title: t('account.action'),
      dataIndex: 'action',
      key: 'action',
      render: (action: ApprovalRecord['action']) => (
        <Tag color={action === 'approve' ? 'green' : 'red'}>
          {action === 'approve' ? t('action.approve') : t('action.reject')}
        </Tag>
      ),
    },
    {
      title: t('account.approvedBy'),
      key: 'actor',
      render: (_: unknown, r: ApprovalRecord) => (
        <span>
          {r.actorSnapshot.name}
          <Typography.Text type="secondary"> ({r.actorSnapshot.email})</Typography.Text>
        </span>
      ),
    },
    { title: t('account.reason'), dataIndex: 'reason', key: 'reason' },
    {
      title: t('account.decidedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title={t('account.historyTitle')} footer={null}>
      <Table<ApprovalRecord>
        rowKey="id"
        size="small"
        loading={isLoading}
        columns={columns}
        dataSource={data ?? []}
        locale={{ emptyText: t('account.noHistory') }}
        pagination={false}
      />
    </Modal>
  );
}
