import { Button, Space, Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/lib/utils';
import type { User } from '../types';

interface UsersTableProps {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleColor: Record<User['role'], string> = {
  admin: 'red',
  editor: 'blue',
  viewer: 'default',
};

/** Presentational table. All data + handlers come from props. */
export function UsersTable({
  data,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: UsersTableProps) {
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
      columns={[
        { title: t('user.name'), dataIndex: 'name' },
        { title: t('user.email'), dataIndex: 'email' },
        {
          title: t('user.role'),
          dataIndex: 'role',
          render: (role: User['role']) => <Tag color={roleColor[role]}>{role}</Tag>,
        },
        {
          title: t('user.createdAt'),
          dataIndex: 'createdAt',
          render: (value: string) => formatDate(value),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, record) => (
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
