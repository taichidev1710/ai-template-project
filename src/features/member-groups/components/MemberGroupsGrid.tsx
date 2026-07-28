import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberGroupsViewProps } from './MemberGroupsTable';

export function MemberGroupsGrid({
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
        {data.map((g) => (
          <Card
            key={g.id}
            title={g.name}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(g)}
              />,
              ...(canUpdate
                ? [
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t('action.edit')}
                      onClick={() => onEdit(g)}
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
                      onClick={() => onDelete(g)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={8} className="w-full">
              <Typography.Text code>{g.key}</Typography.Text>
              <Typography.Text type="secondary">{g.description || '—'}</Typography.Text>
              <Tag>
                {g.grants.length} {t('group.grants')}
              </Tag>
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
