import { Button, Descriptions, Modal, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/shared/lib/utils';
import type { User } from '../types';

interface UserDetailModalProps {
  open: boolean;
  user: User | null;
  onEdit: (user: User) => void;
  onClose: () => void;
}

const roleColor: Record<User['role'], string> = {
  admin: 'red',
  editor: 'blue',
  viewer: 'default',
};

/**
 * Read-only detail view, opened from a row/card's "View" action. The "Edit"
 * footer button hands off to `UserFormModal` — the page owns which is open.
 */
export function UserDetailModal({ open, user, onEdit, onClose }: UserDetailModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={t('user.detailTitle')}
      onCancel={onClose}
      destroyOnHidden
      footer={
        user && [
          <Button key="close" onClick={onClose}>
            {t('action.cancel')}
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => onEdit(user)}>
            {t('action.edit')}
          </Button>,
        ]
      }
    >
      {user && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('user.name')}>{user.name}</Descriptions.Item>
          <Descriptions.Item label={t('user.email')}>{user.email}</Descriptions.Item>
          <Descriptions.Item label={t('user.role')}>
            <Tag color={roleColor[user.role]}>{user.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('user.createdAt')}>{formatDate(user.createdAt)}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
