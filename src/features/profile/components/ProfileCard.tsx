import type { ReactNode } from 'react';
import { Alert, Avatar, Card, Divider, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getTierConfig, resolveFields } from '../config/tiers';
import { resolveActions, resolveActionKeys } from '../config/actions';
import { getStatusConfig } from '../config/status';
import { buildProfileContext } from '../config/conditions';
import { ProfileTierBadge } from './ProfileTierBadge';
import { ProfileStatusBadge } from './ProfileStatusBadge';
import { ProfileInfoList } from './ProfileInfoList';
import { ProfileActions } from './ProfileActions';
import type { Profile, ProfileAction, ProfileActionKey, ProfileSurface } from '../types';

export interface ProfileCardProps {
  profile: Profile;
  /** Which feature/route embeds the card — fed into rule conditions + presets. */
  surface?: ProfileSurface;
  /** Viewer permission check — fed into rule conditions. */
  can?: (permission: string) => boolean;
  /** Override the default (context-resolved) action set entirely. */
  actions?: ProfileActionKey[];
  /** Append feature-specific actions after the resolved ones. */
  extraActions?: ProfileAction[];
  /** Hide base/tier fields by id (compact or embedded variants). */
  hiddenFields?: string[];
  /** Consumer decides what each action does. */
  onAction?: (key: ProfileAction['key'], profile: Profile) => void;
  /** Inject custom content below the info block (render-prop slot). */
  renderExtra?: (profile: Profile) => ReactNode;
  variant?: 'full' | 'compact';
  loading?: boolean;
}

/**
 * Reusable profile card. Everything shown/enabled is derived from ONE resolver
 * pass over a `ProfileContext` (tier ∧ status ∧ surface ∧ permission), then the
 * consumer's overrides (actions / extraActions / hiddenFields) win on top.
 */
export function ProfileCard({
  profile,
  surface,
  can,
  actions,
  extraActions = [],
  hiddenFields = [],
  onAction,
  renderExtra,
  variant = 'full',
  loading,
}: ProfileCardProps) {
  const { t } = useTranslation();
  const ctx = buildProfileContext(profile, { surface, can });
  const tier = getTierConfig(profile.tier);
  const status = getStatusConfig(ctx.status);
  const compact = variant === 'compact';

  const fields = resolveFields(ctx).filter((f) => !hiddenFields.includes(f.id));

  const baseActions = actions ? resolveActionKeys(actions, ctx) : resolveActions(ctx);
  const resolvedActions: ProfileAction[] = [...baseActions, ...extraActions];

  return (
    <Card loading={loading} className="max-w-3xl">
      <div className="flex items-center gap-4">
        <Avatar size={compact ? 48 : 64} src={profile.avatarUrl} icon={<UserOutlined />} />
        <div className="min-w-0">
          <Space align="center" wrap>
            <Typography.Title level={compact ? 5 : 4} className="!mb-0">
              {profile.name}
            </Typography.Title>
            <ProfileTierBadge tier={profile.tier} />
            <ProfileStatusBadge status={ctx.status} />
          </Space>
          {!compact && profile.bio && !hiddenFields.includes('bio') && (
            <Typography.Paragraph type="secondary" className="!mb-0">
              {profile.bio}
            </Typography.Paragraph>
          )}
        </div>
      </div>

      {status.banner && status.bannerMsg && (
        <Alert className="!mt-4" type={status.banner} showIcon message={t(status.bannerMsg)} />
      )}

      <Divider className="!my-4" />

      <ProfileInfoList profile={profile} fields={fields} column={compact ? 1 : 2} />

      {!compact && tier.perks && tier.perks.length > 0 && (
        <>
          <Divider className="!my-4" />
          <Typography.Text strong>{t('profile.perks')}</Typography.Text>
          <ul className="mt-2 mb-0 pl-5 text-muted">
            {tier.perks.map((perk) => (
              <li key={perk}>{t(perk)}</li>
            ))}
          </ul>
        </>
      )}

      {renderExtra && (
        <>
          <Divider className="!my-4" />
          {renderExtra(profile)}
        </>
      )}

      {resolvedActions.length > 0 && (
        <>
          <Divider className="!my-4" />
          <ProfileActions profile={profile} actions={resolvedActions} onAction={onAction} />
        </>
      )}
    </Card>
  );
}
