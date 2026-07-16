import { Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Profile, ProfileAction } from '../types';

interface ProfileActionsProps {
  profile: Profile;
  /** Already-resolved action definitions (tier defaults + any extras). */
  actions: ProfileAction[];
  /** Consumer decides behaviour; this component only renders + dispatches. */
  onAction?: (key: ProfileAction['key'], profile: Profile) => void;
}

/** Renders a row of action buttons from config. Behaviour is delegated out. */
export function ProfileActions({ profile, actions, onAction }: ProfileActionsProps) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;
  return (
    <Space wrap>
      {actions.map((a) => (
        <Button
          key={a.key}
          type={a.type}
          danger={a.danger}
          icon={a.icon}
          disabled={a.disabled}
          onClick={() => onAction?.(a.key, profile)}
        >
          {t(a.label)}
        </Button>
      ))}
    </Space>
  );
}
