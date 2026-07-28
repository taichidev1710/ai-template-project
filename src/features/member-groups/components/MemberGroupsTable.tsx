import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberGroup } from '../types';

export interface MemberGroupsViewProps {
  data: MemberGroup[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (group: MemberGroup) => void;
  onEdit: (group: MemberGroup) => void;
  onDelete: (group: MemberGroup) => void;
}

export function MemberGroupsTable({
  data,
  total,
  page,
  pageSize,
  loading,
  canUpdate,
  canDelete,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: MemberGroupsViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<MemberGroup>
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
              {canUpdate && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={t('action.edit')}
                  onClick={() => onEdit(g)}
                />
              )}
              {canDelete && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(g)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
