import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Role } from '../types';

interface Props {
  open: boolean;
  role: Role | null;
  canEdit: boolean;
  onEdit: (role: Role) => void;
  onClose: () => void;
}

/** Read-only detail view (opened by the "View" action). Hands off to the form modal via "Edit". */
export function RoleDetailModal({ open, role, canEdit, onEdit, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={role?.name}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        role && [
          <Button key="close" onClick={onClose}>
            {t('action.close')}
          </Button>,
          ...(canEdit && !role.isSystem
            ? [
                <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => onEdit(role)}>
                  {t('action.edit')}
                </Button>,
              ]
            : []),
        ]
      }
    >
      {role && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('role.name')}>{role.name}</Descriptions.Item>
          <Descriptions.Item label={t('role.key')}>{role.key}</Descriptions.Item>
          <Descriptions.Item label={t('role.level')}>{role.level}</Descriptions.Item>
          <Descriptions.Item label={t('role.description')}>{role.description || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('role.system')}>
            {role.isSystem ? t('common.yes') : t('common.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('role.permissions')}>
            <Space size={[4, 4]} wrap>
              {role.permissions.length === 0
                ? '—'
                : role.permissions.map((p) => (
                    <Tag key={p} bordered={false}>
                      {p}
                    </Tag>
                  ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
