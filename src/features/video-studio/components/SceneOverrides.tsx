import { Select, Tooltip, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { AspectRatio, Scene } from '@/domain/video';

interface SceneOverridesProps {
  /** The batch defaults (from RunConfig) shown when a scene has no override. */
  defaultAspect: AspectRatio;
  defaultCount: number;
  aspectOverride?: AspectRatio;
  countOverride?: number;
  aspectOptions: readonly AspectRatio[];
  /** Patch the scene. Picking the default value clears the override. */
  onChange: (patch: Partial<Pick<Scene, 'aspectOverride' | 'countOverride'>>) => void;
}

/**
 * Per-scene aspect + count controls (spec §11 override, §13.3 "sửa tỷ lệ riêng ô").
 * Both selects ALWAYS show the EFFECTIVE value (override, else the config default),
 * so the number is consistent across the scene list, the preview card and the
 * variant rows. Choosing the default clears the override; a "riêng" tag marks a
 * scene that differs from the batch config.
 */
export function SceneOverrides({
  defaultAspect,
  defaultCount,
  aspectOverride,
  countOverride,
  aspectOptions,
  onChange,
}: SceneOverridesProps) {
  const { t } = useTranslation('video-studio');
  const overridden = aspectOverride !== undefined || countOverride !== undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip title={t('scene.aspectOverride')}>
        <Select
          size="small"
          value={aspectOverride ?? defaultAspect}
          onChange={(v: AspectRatio) => onChange({ aspectOverride: v === defaultAspect ? undefined : v })}
          options={aspectOptions.map((a) => ({ value: a, label: a }))}
          style={{ width: 84 }}
        />
      </Tooltip>
      <Tooltip title={t('scene.countOverride')}>
        <Select
          size="small"
          value={countOverride ?? defaultCount}
          onChange={(v: number) => onChange({ countOverride: v === defaultCount ? undefined : v })}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: `×${n}` }))}
          style={{ width: 68 }}
        />
      </Tooltip>
      {overridden && (
        <Tag variant="filled" color="blue" className="!m-0">
          {t('scene.overridden')}
        </Tag>
      )}
    </div>
  );
}
