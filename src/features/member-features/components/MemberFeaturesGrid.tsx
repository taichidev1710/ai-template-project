import { Button, Card, Empty, Pagination, Skeleton, Space, Switch, Tag, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberFeaturesViewProps } from './MemberFeaturesTable';

export function MemberFeaturesGrid({
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
}: MemberFeaturesViewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: pageSize }, (_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) return <Empty description={t('empty')} />;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((f) => (
          <Card
            key={f.id}
            title={f.name}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(f)}
              />,
              ...(canUpdate
                ? [
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t('action.edit')}
                      onClick={() => onEdit(f)}
                    />,
                  ]
                : []),
              ...(canDelete
                ? [
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t('action.delete')}
                      onClick={() => onDelete(f)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <Typography.Text code>{f.key}</Typography.Text>
              <Space size={4} wrap>
                {f.actions.map((a) => (
                  <Tag key={a.key}>{a.key}</Tag>
                ))}
              </Space>
              <span className="flex items-center gap-2">
                <Switch
                  size="small"
                  checked={f.enabled}
                  disabled={!canUpdate}
                  onChange={(checked) => onToggleEnabled(f, checked)}
                />
                <span className="text-muted">{t('feature.enabled')}</span>
              </span>
            </Space>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          onChange={onPageChange}
        />
      </div>
    </>
  );
}
