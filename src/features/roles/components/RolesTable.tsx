import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Role } from '../types';

export interface RolesViewProps {
  data: Role[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

/** Presentational table. All data + handlers come from props (shares props with RolesGrid). */
export function RolesTable({
  data,
  total,
  page,
  pageSize,
  loading,
  canEdit,
  canDelete,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: RolesViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<Role>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('role.name'), dataIndex: 'name' },
        {
          title: t('role.key'),
          dataIndex: 'key',
          render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
        },
        { title: t('role.level'), dataIndex: 'level', width: 90 },
        {
          title: t('role.permissions'),
          dataIndex: 'permissions',
          render: (perms: string[]) => <Tag>{perms.includes('*') ? '*' : perms.length}</Tag>,
        },
        {
          title: t('role.system'),
          dataIndex: 'isSystem',
          width: 90,
          render: (v: boolean) => (v ? <Tag color="blue">{t('role.system')}</Tag> : null),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, role) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(role)}
              />
              {canEdit && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={t('action.edit')}
                  onClick={() => onEdit(role)}
                />
              )}
              {canDelete && !role.isSystem && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(role)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
