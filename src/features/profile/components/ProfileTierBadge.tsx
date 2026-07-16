import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { getTierConfig } from '../config/tiers';
import type { ProfileTier } from '../types';

interface ProfileTierBadgeProps {
  tier: ProfileTier;
}

/** Standalone tier badge — reusable anywhere a tier needs a label + color. */
export function ProfileTierBadge({ tier }: ProfileTierBadgeProps) {
  const { t } = useTranslation();
  const cfg = getTierConfig(tier);
  return (
    <Tag color={cfg.color} icon={cfg.icon} className="!m-0">
      {t(cfg.label)}
    </Tag>
  );
}
