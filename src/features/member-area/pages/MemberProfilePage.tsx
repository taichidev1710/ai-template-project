import { Card, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  active: 'green',
  disabled: 'default',
  rejected: 'red',
};

export function MemberProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-2xl">
      <Card title={t('memberArea.profile')}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('member.name')}>{user?.name}</Descriptions.Item>
          <Descriptions.Item label={t('member.email')}>{user?.email}</Descriptions.Item>
          <Descriptions.Item label={t('member.status')}>
            {user?.status && (
              <Tag color={STATUS_COLOR[user.status]}>{t(`status.${user.status}`)}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('memberArea.yourTier')}>
            {user?.tier ? (
              <Tag color={user.tier.color || 'blue'}>{user.tier.name}</Tag>
            ) : (
              t('memberArea.noTier')
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
