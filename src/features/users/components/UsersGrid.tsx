import { Button, Card, Empty, Pagination, Skeleton, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/lib/utils';
import type { User } from '../types';

interface UsersGridProps {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleColor: Record<User['role'], string> = {
  admin: 'red',
  editor: 'blue',
  viewer: 'default',
};

/**
 * Card-grid alternative view for the same list. Same data + handlers as
 * `UsersTable` via props — only the layout differs. Toggled by `UsersPage`.
 *
 * Plain CSS grid + `Pagination`, not AntD `List` — `List` is deprecated in
 * AntD 6 (no in-library grid replacement yet), so a new grid module should
 * follow this shape rather than reach for it.
 */
export function UsersGrid({ data, total, page, pageSize, loading, onPageChange, onView, onEdit, onDelete }: UsersGridProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: pageSize }, (_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <Empty description={t('empty')} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((user) => (
          <Card
            key={user.id}
            title={user.name}
            actions={[
              <Button key="view" type="text" icon={<EyeOutlined />} aria-label="View" onClick={() => onView(user)} />,
              <Button key="edit" type="text" icon={<EditOutlined />} aria-label="Edit" onClick={() => onEdit(user)} />,
              <Button
                key="delete"
                type="text"
                danger
                icon={<DeleteOutlined />}
                aria-label="Delete"
                onClick={() => onDelete(user)}
              />,
            ]}
          >
            <Space orientation="vertical" size={4} className="w-full">
              <span className="text-muted">{user.email}</span>
              <Tag color={roleColor[user.role]}>{user.role}</Tag>
              <span className="text-muted text-xs">{formatDate(user.createdAt)}</span>
            </Space>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Pagination current={page} pageSize={pageSize} total={total} showSizeChanger onChange={onPageChange} />
      </div>
    </>
  );
}
