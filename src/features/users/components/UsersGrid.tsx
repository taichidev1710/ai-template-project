import { Button, Card, Empty, Pagination, Skeleton, Space, Tag } from 'antd';
import {
  EyeOutlined,
  SafetyOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UserStatus } from '@/shared/stores/auth-store';
import { STATUS_COLOR, type UsersViewProps } from './UsersTable';

export function UsersGrid({
  data,
  total,
  page,
  pageSize,
  loading,
  roleName,
  canAssign,
  canManageStatus,
  canDelete,
  onPageChange,
  onView,
  onAssign,
  onToggleStatus,
  onDelete,
}: UsersViewProps) {
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
        {data.map((user) => (
          <Card
            key={user.id}
            title={user.name}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                aria-label={t('action.view')}
                onClick={() => onView(user)}
              />,
              ...(canAssign
                ? [
                    <Button
                      key="assign"
                      type="text"
                      icon={<SafetyOutlined />}
                      aria-label={t('action.assign')}
                      onClick={() => onAssign(user)}
                    />,
                  ]
                : []),
              ...(canManageStatus && (user.status === 'active' || user.status === 'disabled')
                ? [
                    <Button
                      key="status"
                      type="text"
                      icon={user.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                      aria-label={user.status === 'active' ? t('action.disable') : t('action.enable')}
                      onClick={() => onToggleStatus(user)}
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
                      onClick={() => onDelete(user)}
                    />,
                  ]
                : []),
            ]}
          >
            <Space orientation="vertical" size={4} className="w-full">
              <span className="text-muted">{user.email}</span>
              <Space size={4} wrap>
                {user.roleIds.map((id) => (
                  <Tag key={id}>{roleName.get(id) ?? id.slice(-4)}</Tag>
                ))}
              </Space>
              <Tag color={STATUS_COLOR[user.status as UserStatus]}>{t(`status.${user.status}`)}</Tag>
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
