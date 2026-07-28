import { Button, Descriptions, Modal, Space, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MemberFeatureItem } from '../types';

interface Props {
  open: boolean;
  feature: MemberFeatureItem | null;
  canUpdate: boolean;
  onEdit: (feature: MemberFeatureItem) => void;
  onClose: () => void;
}

export function MemberFeatureDetailModal({ open, feature, canUpdate, onEdit, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={feature?.name}
      onCancel={onClose}
      destroyOnHidden
      width={560}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        feature && [
          <Button key="close" onClick={onClose}>
            {t('action.close')}
          </Button>,
          ...(canUpdate
            ? [
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(feature)}
                >
                  {t('action.edit')}
                </Button>,
              ]
            : []),
        ]
      }
    >
      {feature && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('feature.name')}>{feature.name}</Descriptions.Item>
          <Descriptions.Item label={t('feature.key')}>{feature.key}</Descriptions.Item>
          <Descriptions.Item label={t('feature.description')}>
            {feature.description || '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('feature.enabled')}>
            {feature.enabled ? t('common.yes') : t('common.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('feature.actions')}>
            <Space size={[4, 4]} wrap>
              {feature.actions.map((a) => (
                <Tag key={a.key} bordered={false}>
                  {a.label} <code>{a.key}</code>
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
