import { Descriptions, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MemberItem } from '../types';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  active: 'green',
  disabled: 'default',
  rejected: 'red',
};

interface Props {
  open: boolean;
  member: MemberItem | null;
  tierName: Map<string, string>;
  onClose: () => void;
}

export function MemberDetailModal({ open, member, tierName, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={member?.name}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={520}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      {member && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('member.name')}>{member.name}</Descriptions.Item>
          <Descriptions.Item label={t('member.email')}>{member.email}</Descriptions.Item>
          <Descriptions.Item label={t('member.status')}>
            <Tag color={STATUS_COLOR[member.status]}>{t(`status.${member.status}`)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('member.tier')}>
            {member.tierId ? (tierName.get(member.tierId) ?? member.tierId.slice(-6)) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('member.adhocGroups')}>
            {member.memberPermissionGroupIds.length}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
