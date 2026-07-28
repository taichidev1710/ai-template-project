import { Button, Space, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TierItem } from '../types';

export interface TiersViewProps {
  data: TierItem[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (tier: TierItem) => void;
  onEdit: (tier: TierItem) => void;
  onDelete: (tier: TierItem) => void;
}

export function TiersTable({
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
}: TiersViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<TierItem>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        {
          title: t('tier.name'),
          dataIndex: 'name',
          render: (name: string, tier) => (
            <Space>
              {tier.color ? (
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
              ) : null}
              {name}
            </Space>
          ),
        },
        {
          title: t('tier.key'),
          dataIndex: 'key',
          render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
        },
        { title: t('tier.rank'), dataIndex: 'rank', width: 90 },
        {
          title: t('tier.groups'),
          dataIndex: 'permissionGroupIds',
          render: (ids: string[]) => <Tag>{ids.length}</Tag>,
        },
        {
          title: t('tier.flags'),
          key: 'flags',
          render: (_, tier) => (
            <Space size={4} wrap>
              {tier.isDefault && <Tag color="gold">{t('tier.default')}</Tag>}
              <Tag color={tier.isActive ? 'green' : 'default'}>
                {tier.isActive ? t('tier.active') : t('tier.inactive')}
              </Tag>
            </Space>
          ),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, tier) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(tier)}
              />
              {canUpdate && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={t('action.edit')}
                  onClick={() => onEdit(tier)}
                />
              )}
              {canDelete && !tier.isDefault && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(tier)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
