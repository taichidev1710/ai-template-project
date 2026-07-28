import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TierItem } from '../types';

interface Props {
  open: boolean;
  tier: TierItem | null;
  groupName: Map<string, string>;
  canUpdate: boolean;
  onEdit: (tier: TierItem) => void;
  onClose: () => void;
}

export function TierDetailModal({ open, tier, groupName, canUpdate, onEdit, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={tier?.name}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        tier && [
          <Button key="close" onClick={onClose}>
            {t('action.close')}
          </Button>,
          ...(canUpdate
            ? [
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(tier)}
                >
                  {t('action.edit')}
                </Button>,
              ]
            : []),
        ]
      }
    >
      {tier && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('tier.name')}>{tier.name}</Descriptions.Item>
          <Descriptions.Item label={t('tier.key')}>{tier.key}</Descriptions.Item>
          <Descriptions.Item label={t('tier.rank')}>{tier.rank}</Descriptions.Item>
          <Descriptions.Item label={t('tier.description')}>
            {tier.description || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('tier.flags')}>
            <Space size={4} wrap>
              {tier.isDefault && <Tag color="gold">{t('tier.default')}</Tag>}
              <Tag color={tier.isActive ? 'green' : 'default'}>
                {tier.isActive ? t('tier.active') : t('tier.inactive')}
              </Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('tier.groups')}>
            <Space size={[4, 4]} wrap>
              {tier.permissionGroupIds.length === 0
                ? '—'
                : tier.permissionGroupIds.map((id) => (
                    <Tag key={id} bordered={false}>
                      {groupName.get(id) ?? id.slice(-6)}
                    </Tag>
                  ))}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('tier.perks')}>
            <Space size={[4, 4]} wrap>
              {tier.perks.length === 0
                ? '—'
                : tier.perks.map((p) => (
                    <Tag key={p} color="purple" bordered={false}>
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
