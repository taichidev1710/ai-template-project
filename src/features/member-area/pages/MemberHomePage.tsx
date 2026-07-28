import { Card, Empty, Space, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';
import { useUnlockedMemberFeatures } from '../use-member-access';

export function MemberHomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const features = useUnlockedMemberFeatures();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Typography.Title level={3} className="!mb-1">
          {t('memberArea.welcome', { name: user?.name ?? '' })}
        </Typography.Title>
        <Space size={8} wrap>
          <Typography.Text type="secondary">{t('memberArea.yourTier')}:</Typography.Text>
          {user?.tier ? (
            <Tag color={user.tier.color || 'blue'}>{user.tier.name}</Tag>
          ) : (
            <Tag>{t('memberArea.noTier')}</Tag>
          )}
        </Space>
      </div>

      <div>
        <Typography.Title level={5}>{t('memberArea.yourFeatures')}</Typography.Title>
        {features.length === 0 ? (
          <Empty description={t('memberArea.noFeatures')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.key} title={f.name} size="small">
                <Space size={[4, 4]} wrap>
                  {f.allowedActions.map((a) => (
                    <Tag key={a.key} bordered={false}>
                      {a.label}
                    </Tag>
                  ))}
                </Space>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
