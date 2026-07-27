import { Button, Card, Empty, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { RolesViewProps } from './RolesTable';

/** Card-grid alternative view — same props as RolesTable, only layout differs. */
export function RolesGrid({
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
        {data.map((role) => (
          <Card
            key={role.id}
            title={role.name}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(role)}
              />,
              ...(canEdit
                ? [
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t('action.edit')}
                      onClick={() => onEdit(role)}
                    />,
                  ]
                : []),
              ...(canDelete && !role.isSystem
                ? [
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      aria-label={t('action.delete')}
                      onClick={() => onDelete(role)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={4} className="w-full">
              <Typography.Text code>{role.key}</Typography.Text>
              <span className="text-muted">
                {t('role.level')}: {role.level}
              </span>
              <span>
                {role.isSystem && <Tag color="blue">{t('role.system')}</Tag>}
                <Tag>{role.permissions.includes('*') ? '*' : role.permissions.length}</Tag>
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
