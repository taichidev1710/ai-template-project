import { Button, Space, Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, SafetyOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UserStatus } from '@/shared/stores/auth-store';
import type { User } from '../types';

export const STATUS_COLOR: Record<UserStatus, string> = {
  pending: 'orange',
  active: 'green',
  rejected: 'red',
  disabled: 'default',
};

export interface UsersViewProps {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  roleName: Map<string, string>;
  canAssign: boolean;
  canManageStatus: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (user: User) => void;
  onAssign: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({
  data,
  total,
  page,
  pageSize,
  loading,
  roleName,
  canAssign,
  canManageStatus,
  canDelete,
  onPageChange,
  onView,
  onAssign,
  onToggleStatus,
  onDelete,
}: UsersViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<User>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('user.name'), dataIndex: 'name' },
        { title: t('user.email'), dataIndex: 'email' },
        {
          title: t('user.role'),
          dataIndex: 'roleIds',
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
          width: 120,
          render: (s: UserStatus) => <Tag color={STATUS_COLOR[s]}>{t(`status.${s}`)}</Tag>,
        },
        {
          title: '',
          key: 'actions',
          width: 180,
          render: (_, user) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(user)}
              />
              {canAssign && (
                <Button
                  type="text"
                  icon={<SafetyOutlined />}
                  aria-label={t('action.assign')}
                  onClick={() => onAssign(user)}
                />
              )}
              {canManageStatus && user.status === 'active' && (
                <Button
                  type="text"
                  icon={<StopOutlined />}
                  aria-label={t('action.disable')}
                  onClick={() => onToggleStatus(user)}
                />
              )}
              {canManageStatus && user.status === 'disabled' && (
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  aria-label={t('action.enable')}
                  onClick={() => onToggleStatus(user)}
                />
              )}
              {canDelete && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(user)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
