import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { getStatusConfig } from '../config/status';
import type { ProfileStatus } from '../types';

interface ProfileStatusBadgeProps {
  status: ProfileStatus;
}

/** Standalone status badge — reusable wherever a status needs a label + color. */
export function ProfileStatusBadge({ status }: ProfileStatusBadgeProps) {
  const { t } = useTranslation();
  const cfg = getStatusConfig(status);
  return (
    <Tag color={cfg.color} className="!m-0">
      {t(cfg.label)}
    </Tag>
  );
}
