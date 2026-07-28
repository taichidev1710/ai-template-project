import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TiersViewProps } from './TiersTable';

export function TiersGrid({
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
        {data.map((tier) => (
          <Card
            key={tier.id}
            title={
              <Space>
                {tier.color ? (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                ) : null}
                {tier.name}
              </Space>
            }
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(tier)}
              />,
              ...(canUpdate
                ? [
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t('action.edit')}
                      onClick={() => onEdit(tier)}
                    />,
                  ]
                : []),
              ...(canDelete && !tier.isDefault
                ? [
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t('action.delete')}
                      onClick={() => onDelete(tier)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <Typography.Text code>{tier.key}</Typography.Text>
              <span>
                {t('tier.rank')}: {tier.rank}
              </span>
              <Space size={4} wrap>
                <Tag>
                  {tier.permissionGroupIds.length} {t('tier.groups')}
                </Tag>
                {tier.isDefault && <Tag color="gold">{t('tier.default')}</Tag>}
                <Tag color={tier.isActive ? 'green' : 'default'}>
                  {tier.isActive ? t('tier.active') : t('tier.inactive')}
                </Tag>
              </Space>
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
