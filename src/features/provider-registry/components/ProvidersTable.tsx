import { Button, Space, Switch, Table, Tag, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProviderItem } from '../types';

export interface ProvidersTableProps {
  data: ProviderItem[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (provider: ProviderItem) => void;
  onDelete: (provider: ProviderItem) => void;
  onToggleEnabled: (provider: ProviderItem, enabled: boolean) => void;
}

const OUTPUT_COLOR: Record<string, string> = { video: 'geekblue', image: 'magenta' };
const STATUS_COLOR: Record<string, string> = { stable: 'green', beta: 'gold', deprecated: 'red' };

export function ProvidersTable({
  data,
  total,
  page,
  pageSize,
  loading,
  canUpdate,
  canDelete,
  onPageChange,
  onEdit,
  onDelete,
  onToggleEnabled,
}: ProvidersTableProps) {
  const { t } = useTranslation();

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: onPageChange,
  };

  return (
    <Table<ProviderItem>
      rowKey="id"
      loading={loading}
      dataSource={data}
      pagination={pagination}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: t('empty') }}
      columns={[
        { title: t('provider.label'), dataIndex: 'label' },
        {
          title: t('provider.key'),
          dataIndex: 'key',
          render: (v: string) => <Typography.Text code>{v}</Typography.Text>,
        },
        {
          title: t('provider.outputType'),
          dataIndex: 'outputType',
          render: (v: string) => (
            <Tag color={OUTPUT_COLOR[v] ?? 'default'}>{t(`provider.output.${v}`, v)}</Tag>
          ),
        },
        {
          title: t('provider.adapter'),
          dataIndex: 'adapterId',
          render: (v: string) => <Tag>{v}</Tag>,
        },
        {
          title: t('provider.models'),
          dataIndex: 'models',
          render: (models: ProviderItem['models']) => (
            <Space size={4} wrap>
              {models.map((m) => (
                <Tag key={m.tier} color={m.enabled ? undefined : 'default'}>
                  {m.tier}
                </Tag>
              ))}
            </Space>
          ),
        },
        {
          title: t('provider.status'),
          dataIndex: 'status',
          render: (v: string) => (
            <Tag color={STATUS_COLOR[v] ?? 'default'}>{t(`provider.statusValue.${v}`, v)}</Tag>
          ),
        },
        {
          title: t('provider.enabled'),
          dataIndex: 'enabled',
          width: 100,
          render: (enabled: boolean, p) => (
            <Switch
              checked={enabled}
              disabled={p.isSystem || !canUpdate}
              onChange={(checked) => onToggleEnabled(p, checked)}
            />
          ),
        },
        {
          title: t('provider.system'),
          dataIndex: 'isSystem',
          width: 90,
          render: (v: boolean) => (v ? <Tag color="blue">{t('provider.system')}</Tag> : null),
        },
        {
          title: '',
          key: 'rowActions',
          width: 96,
          render: (_, p) => (
            <Space>
              {canUpdate && !p.isSystem && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={t('action.edit')}
                  onClick={() => onEdit(p)}
                />
              )}
              {canDelete && !p.isSystem && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label={t('action.delete')}
                  onClick={() => onDelete(p)}
                />
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
