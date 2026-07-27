import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UserStatus } from '@/shared/stores/auth-store';
import { STATUS_COLOR } from './UsersTable';
import type { User } from '../types';

interface Props {
  open: boolean;
  user: User | null;
  roleName: Map<string, string>;
  userName: Map<string, string>;
  canAssign: boolean;
  onAssign: (user: User) => void;
  onClose: () => void;
}

export function UserDetailModal({
  open,
  user,
  roleName,
  userName,
  canAssign,
  onAssign,
  onClose,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={user?.name}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        user && [
          <Button key="close" onClick={onClose}>
            {t('action.close')}
          </Button>,
          ...(canAssign
            ? [
                <Button key="assign" type="primary" icon={<SafetyOutlined />} onClick={() => onAssign(user)}>
                  {t('action.assign')}
                </Button>,
              ]
            : []),
        ]
      }
    >
      {user && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('user.name')}>{user.name}</Descriptions.Item>
          <Descriptions.Item label={t('user.email')}>{user.email}</Descriptions.Item>
          <Descriptions.Item label={t('profile.field.status')}>
            <Tag color={STATUS_COLOR[user.status as UserStatus]}>{t(`status.${user.status}`)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('user.role')}>
            <Space size={[4, 4]} wrap>
              {user.roleIds.length === 0
                ? '—'
                : user.roleIds.map((id) => <Tag key={id}>{roleName.get(id) ?? id.slice(-4)}</Tag>)}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('user.manager')}>
            {user.managerId
              ? (userName.get(user.managerId) ?? user.managerId.slice(-6))
              : t('user.managerNone')}
          </Descriptions.Item>
          <Descriptions.Item label={t('group.title')}>
            {user.permissionGroupIds.length}
          </Descriptions.Item>
          <Descriptions.Item label={t('group.grants')}>
            {user.extraPermissions.length}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
