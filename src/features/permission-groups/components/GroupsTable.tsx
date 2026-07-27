import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { PermissionGroup } from '../types';

export interface GroupsViewProps {
  data: PermissionGroup[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  currentUserId?: string;
  canManage: (group: PermissionGroup) => boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

function ownerTag(group: PermissionGroup, currentUserId: string | undefined, labels: { global: string; mine: string }) {
  if (group.ownerId === null) return <Tag color="gold">{labels.global}</Tag>;
  if (group.ownerId === currentUserId) return <Tag color="green">{labels.mine}</Tag>;
  return <Tag>—</Tag>;
}

export function GroupsTable({
  data,
  total,
  page,
  pageSize,
  loading,
  currentUserId,
  canManage,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: GroupsViewProps) {
  const { t } = useTranslation();
  const labels = { global: t('group.global'), mine: t('group.mine') };

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<PermissionGroup>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('group.name'), dataIndex: 'name' },
        {
          title: t('group.key'),
          dataIndex: 'key',
          render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
        },
        {
          title: t('group.grants'),
          dataIndex: 'grants',
          render: (grants: string[]) => <Tag>{grants.length}</Tag>,
        },
        {
          title: t('group.owner'),
          key: 'owner',
          render: (_, g) => ownerTag(g, currentUserId, labels),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, g) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(g)}
              />
              {canManage(g) && (
                <>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label={t('action.edit')}
                    onClick={() => onEdit(g)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={t('action.delete')}
                    onClick={() => onDelete(g)}
                  />
                </>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
