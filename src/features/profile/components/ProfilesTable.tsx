import { Avatar, Button, Space, Table } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/lib/utils';
import { ProfileTierBadge } from './ProfileTierBadge';
import { ProfileStatusBadge } from './ProfileStatusBadge';
import type { Profile } from '../types';

interface ProfilesTableProps {
  data: Profile[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}

/** Presentational list. All data + handlers come from props. */
export function ProfilesTable({
  data,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: ProfilesTableProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<Profile>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      columns={[
        {
          title: t('profile.field.name'),
          dataIndex: 'name',
          render: (name: string, record) => (
            <Space>
              <Avatar size="small" src={record.avatarUrl} icon={<UserOutlined />} />
              {name}
            </Space>
          ),
        },
        { title: t('profile.field.email'), dataIndex: 'email' },
        {
          title: t('profile.field.tier'),
          dataIndex: 'tier',
          render: (tier: Profile['tier']) => <ProfileTierBadge tier={tier} />,
        },
        {
          title: t('profile.field.status'),
          key: 'status',
          render: (_: unknown, record) => <ProfileStatusBadge status={record.status ?? 'active'} />,
        },
        {
          title: t('profile.field.joinedAt'),
          dataIndex: 'joinedAt',
          render: (value: string) => formatDate(value),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_: unknown, record) => (
            <Space>
              <Button type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(record)} />
              <Button type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(record)} />
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete" onClick={() => onDelete(record)} />
            </Space>
          ),
        },
      ]}
    />
  );
}
