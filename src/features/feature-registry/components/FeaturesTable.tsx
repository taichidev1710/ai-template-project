import { Button, Space, Switch, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { FeatureItem } from '../types';

export interface FeaturesViewProps {
  data: FeatureItem[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (feature: FeatureItem) => void;
  onEdit: (feature: FeatureItem) => void;
  onDelete: (feature: FeatureItem) => void;
  onToggleEnabled: (feature: FeatureItem, enabled: boolean) => void;
}

export function FeaturesTable({
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
  onToggleEnabled,
}: FeaturesViewProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<FeatureItem>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('feature.name'), dataIndex: 'name' },
        {
          title: t('feature.key'),
          dataIndex: 'key',
          render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
        },
        {
          title: t('feature.actions'),
          dataIndex: 'actions',
          render: (actions: FeatureItem['actions']) => (
            <Space size={4} wrap>
              {actions.map((a) => (
                <Tag key={a.key}>{a.key}</Tag>
              ))}
            </Space>
          ),
        },
        {
          title: t('feature.enabled'),
          dataIndex: 'enabled',
          width: 110,
          render: (enabled: boolean, f) => (
            <Switch
              checked={enabled}
              disabled={f.isSystem || !canUpdate}
              onChange={(checked) => onToggleEnabled(f, checked)}
            />
          ),
        },
        {
          title: t('feature.system'),
          dataIndex: 'isSystem',
          width: 90,
          render: (v: boolean) => (v ? <Tag color="blue">{t('feature.system')}</Tag> : null),
        },
        {
          title: '',
          key: 'actions',
          width: 132,
          render: (_, f) => (
            <Space>
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(f)}
              />
              {canUpdate && !f.isSystem && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={t('action.edit')}
                  onClick={() => onEdit(f)}
                />
              )}
              {canDelete && !f.isSystem && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(f)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
