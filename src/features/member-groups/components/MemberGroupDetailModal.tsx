import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberGroup } from '../types';

interface Props {
  open: boolean;
  group: MemberGroup | null;
  canUpdate: boolean;
  onEdit: (group: MemberGroup) => void;
  onClose: () => void;
}

export function MemberGroupDetailModal({ open, group, canUpdate, onEdit, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={group?.name}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        group && [
          <Button key="close" onClick={onClose}>
            {t('action.close')}
          </Button>,
          ...(canUpdate
            ? [
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(group)}
                >
                  {t('action.edit')}
                </Button>,
              ]
            : []),
        ]
      }
    >
      {group && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('group.name')}>{group.name}</Descriptions.Item>
          <Descriptions.Item label={t('group.key')}>{group.key}</Descriptions.Item>
          <Descriptions.Item label={t('group.description')}>
            {group.description || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('group.grants')}>
            <Space size={[4, 4]} wrap>
              {group.grants.length === 0
                ? '—'
                : group.grants.map((g) => (
                    <Tag key={g} bordered={false}>
                      <code>{g}</code>
                    </Tag>
                  ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
