import { Card, Empty, List, Space, Tag, Typography } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';

export function MemberPerksPage() {
  const { t } = useTranslation();
  const tier = useAuthStore((s) => s.user?.tier ?? null);

  return (
    <div className="mx-auto max-w-2xl">
      <Card
        title={
          <Space>
            {t('memberArea.perksTitle')}
            {tier && <Tag color={tier.color || 'blue'}>{tier.name}</Tag>}
          </Space>
        }
      >
        {!tier || tier.perks.length === 0 ? (
          <Empty description={t('memberArea.noPerks')} />
        ) : (
          <>
            {tier.description && (
              <Typography.Paragraph type="secondary">{tier.description}</Typography.Paragraph>
            )}
            <List
              dataSource={tier.perks}
              renderItem={(perk) => (
                <List.Item>
                  <Space>
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                    {perk}
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    </div>
  );
}
