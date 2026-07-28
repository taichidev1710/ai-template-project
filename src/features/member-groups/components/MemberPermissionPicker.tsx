import { Checkbox, Collapse, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMemberFeatures } from '@/features/member-features/hooks/use-member-features';

interface Props {
  /** Selected grants (e.g. ['booking:view', 'wallet:*']). */
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}

/**
 * Grant picker cho thế giới MEMBER — nguồn là registry chức năng thành viên đang bật
 * (khác PermissionPicker của staff dùng enabledFeatures hệ thống). Mỗi chức năng là 1
 * nhóm; action bên trong thành grant `feature:action`.
 */
export function MemberPermissionPicker({ value = [], onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useMemberFeatures({ limit: 100 });
  const features = (data?.items ?? []).filter((f) => f.enabled);

  const toggle = (grant: string, checked: boolean) => {
    const next = checked ? [...new Set([...value, grant])] : value.filter((g) => g !== grant);
    onChange?.(next);
  };

  if (!isLoading && features.length === 0) {
    return <Empty description={t('memberGroup.noFeatures')} />;
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
