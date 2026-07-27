import { Checkbox, Collapse, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/shared/stores/auth-store';

interface Props {
  /** Selected grants (e.g. ['user:read', 'scheduling:*']). */
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}

/**
 * Grouped grant picker driven by the enabled-feature registry (from /users/me).
 * Each feature is a group; its actions become `feature:action` grants. Reused by
 * the Roles and Permission Groups editors so both stay in sync with the registry.
 */
export function PermissionPicker({ value = [], onChange, disabled }: Props) {
  const { t } = useTranslation();
  const features = useAuthStore((s) => s.enabledFeatures);

  const toggle = (grant: string, checked: boolean) => {
    const next = checked ? [...new Set([...value, grant])] : value.filter((g) => g !== grant);
    onChange?.(next);
  };

  if (features.length === 0) {
    return <Empty description={t('empty')} />;
  }

  const items = [...features]
    .sort((a, b) => a.order - b.order)
    .map((f) => {
      const selected = f.actions.filter((a) => value.includes(`${f.key}:${a.key}`)).length;
      return {
        key: f.key,
        label: (
          <span>
            {f.name}{' '}
            <Typography.Text type="secondary">
              ({selected}/{f.actions.length})
            </Typography.Text>
          </span>
        ),
        children: (
          <div className="flex flex-col gap-2">
            {f.actions.map((a) => {
              const grant = `${f.key}:${a.key}`;
              return (
                <Checkbox
                  key={grant}
                  disabled={disabled}
                  checked={value.includes(grant)}
                  onChange={(e) => toggle(grant, e.target.checked)}
                >
                  {a.label} <Typography.Text code>{grant}</Typography.Text>
                </Checkbox>
              );
            })}
          </div>
        ),
      };
    });

  return <Collapse size="small" items={items} />;
}
