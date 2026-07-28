import { Button, Space, Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LockOutlined,
  SettingOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberItem } from '../types';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  active: 'green',
  disabled: 'default',
  rejected: 'red',
};

export interface MembersViewProps {
  data: MemberItem[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  tierName: Map<string, string>;
  canApprove: boolean;
  canManage: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (m: MemberItem) => void;
  onApprove: (m: MemberItem) => void;
  onReject: (m: MemberItem) => void;
  onToggleStatus: (m: MemberItem) => void;
  onManage: (m: MemberItem) => void;
}

export function MembersTable({
  data,
  total,
  page,
  pageSize,
  loading,
  tierName,
  canApprove,
  canManage,
  onPageChange,
  onView,
  onApprove,
  onReject,
  onToggleStatus,
  onManage,
}: MembersViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<MemberItem>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('member.name'), dataIndex: 'name' },
        { title: t('member.email'), dataIndex: 'email' },
        {
          title: t('member.status'),
          dataIndex: 'status',
          render: (s: string) => <Tag color={STATUS_COLOR[s]}>{t(`status.${s}`)}</Tag>,
        },
        {
          title: t('member.tier'),
          dataIndex: 'tierId',
          render: (id: string | null) =>
            id ? (tierName.get(id) ?? id.slice(-6)) : <Tag>{t('member.noTier')}</Tag>,
        },
        {
          title: '',
          key: 'actions',
          width: 200,
          render: (_, m) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(m)}
              />
              {canApprove && m.status === 'pending' && (
                <>
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    aria-label={t('member.approve')}
                    onClick={() => onApprove(m)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    aria-label={t('member.reject')}
                    onClick={() => onReject(m)}
                  />
                </>
              )}
              {canManage && (m.status === 'active' || m.status === 'disabled') && (
                <Button
                  type="text"
                  icon={m.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                  aria-label={m.status === 'active' ? t('member.disable') : t('member.enable')}
                  onClick={() => onToggleStatus(m)}
                />
              )}
              {canManage && (
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  aria-label={t('member.manage')}
                  onClick={() => onManage(m)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
