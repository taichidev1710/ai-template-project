import type { ReactNode } from 'react';
import { Segmented, Select, Switch, InputNumber, Typography, Space, Collapse } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DELAY_OPTIONS,
  getSpeedTier,
  resolvePreset,
  type AspectRatio,
  type DelaySeconds,
  type PlatformPreset,
  type ProviderCapabilities,
  type RunConfig,
  type SpeedTier,
} from '@/domain/video';
import { FreeModeWarning } from './FreeModeWarning';
import { formatUsd } from '../lib';

interface ConfigPanelProps {
  config: RunConfig;
  caps: ProviderCapabilities | undefined;
  providers: readonly ProviderCapabilities[];
  preset: PlatformPreset | null;
  onChange: (patch: Partial<RunConfig>) => void;
  onProviderChange: (providerId: string) => void;
  onPresetChange: (preset: PlatformPreset | null) => void;
}

const PRESETS: { value: PlatformPreset; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'reels', label: 'Reels' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'instagram-feed', label: 'Instagram feed' },
  { value: 'instagram-portrait', label: 'Instagram 4:5' },
];

/** A labelled row wrapping one control — keeps the panel visually consistent. */
function Field({ label, extra, children }: { label: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-2">
        <Typography.Text type="secondary" className="text-xs">
          {label}
        </Typography.Text>
        {extra}
      </div>
      {children}
    </div>
  );
}

/** Left column — the RunConfig editor (spec §13.1). Provider-driven: options come
 * from `caps`, so a provider that lacks a tier/aspect simply never shows it. */
export function ConfigPanel({
  config,
  caps,
  providers,
  preset,
  onChange,
  onProviderChange,
  onPresetChange,
}: ConfigPanelProps) {
  const { t } = useTranslation('video-studio');

  const speedLabel: Record<SpeedTier, string> = {
    fast: t('config.speedFast'),
    normal: t('config.speedNormal'),
    quality: t('config.speedQuality'),
  };

  const speedOptions = (caps?.speedTiers ?? []).map((tier) => ({ value: tier.tier, label: speedLabel[tier.tier] }));
  const aspectOptions = (caps?.aspects ?? []).map((a) => ({ value: a, label: a }));
  const isVideo = (caps?.durations.length ?? 0) > 0;

  const handleSpeed = (speed: SpeedTier) => {
    const tier = caps ? getSpeedTier(caps.id, speed) : undefined;
    onChange({ speed, modelId: tier?.modelId ?? config.modelId, audio: tier?.audio ?? config.audio });
  };

  const handlePreset = (value: PlatformPreset | 'none') => {
    if (value === 'none') {
      onPresetChange(null);
      return;
    }
    onPresetChange(value);
    const resolved = caps ? resolvePreset(caps.id, value) : undefined;
    if (resolved) onChange({ aspect: resolved.targetAspect });
  };

  const tierSpec = caps ? getSpeedTier(caps.id, config.speed) : undefined;
  const priceHint = tierSpec?.pricePerSecond
    ? t('cost.perSecond', { price: formatUsd(tierSpec.pricePerSecond) })
    : tierSpec?.pricePerImage
      ? t('cost.perImage', { price: formatUsd(tierSpec.pricePerImage) })
      : undefined;

  return (
    <div>
      <Field label={t('config.provider')}>
        <Select
          className="w-full"
          value={config.providerId}
          onChange={onProviderChange}
          options={providers.map((p) => ({ value: p.id, label: p.label }))}
        />
      </Field>

      <Field label={t('config.model')}>
        <Typography.Text code className="text-xs">
          {config.modelId || '—'}
        </Typography.Text>
      </Field>

      <Field
        label={t('config.source')}
        extra={config.source === 'session' ? <FreeModeWarning /> : null}
      >
        <Segmented
          value={config.source}
          onChange={(v) => onChange({ source: v as RunConfig['source'] })}
          options={[
            { value: 'api', label: t('config.sourceApi') },
            { value: 'session', label: t('config.sourceSession') },
          ]}
        />
      </Field>

      {speedOptions.length > 0 && (
        <Field label={t('config.speed')} extra={priceHint ? <Typography.Text type="secondary" className="text-xs">{priceHint}</Typography.Text> : null}>
          <Segmented value={config.speed} onChange={(v) => handleSpeed(v as SpeedTier)} options={speedOptions} />
        </Field>
      )}

      {aspectOptions.length > 0 && (
        <Field label={t('config.aspect')}>
          <Space orientation="vertical" className="w-full">
            <Segmented
              value={config.aspect}
              onChange={(v) => {
                onPresetChange(null);
                onChange({ aspect: v as AspectRatio });
              }}
              options={aspectOptions}
            />
            <Select
              className="w-full"
              size="small"
              placeholder={t('config.preset')}
              value={preset ?? 'none'}
              onChange={handlePreset}
              options={[{ value: 'none', label: t('config.presetNone') }, ...PRESETS]}
            />
          </Space>
        </Field>
      )}

      <Field label={t('config.count')}>
        <Segmented
          value={config.count}
          onChange={(v) => onChange({ count: Number(v) })}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
        />
      </Field>

      {isVideo && (
        <Field label={t('config.duration')}>
          <Segmented
            value={config.durationSeconds}
            onChange={(v) => onChange({ durationSeconds: Number(v) })}
            options={(caps?.durations ?? []).map((d) => ({ value: d, label: String(d) }))}
          />
        </Field>
      )}

      {isVideo && (
        <Field label={t('config.audio')}>
          <Switch checked={Boolean(config.audio)} onChange={(audio) => onChange({ audio })} />
        </Field>
      )}

      <Field label={t('config.runMode')}>
        <Segmented
          value={config.runMode}
          onChange={(v) => onChange({ runMode: v as RunConfig['runMode'] })}
          options={[
            { value: 'sequential', label: t('config.runModeSequential') },
            { value: 'all', label: t('config.runModeAll') },
          ]}
        />
      </Field>

      {config.runMode === 'all' && (
        <Field label={t('config.delay')}>
          <Select
            className="w-full"
            value={config.delaySeconds}
            onChange={(v) => onChange({ delaySeconds: v as DelaySeconds })}
            options={DELAY_OPTIONS.map((d) => ({ value: d, label: t('config.delaySeconds', { n: d }) }))}
          />
        </Field>
      )}

      <Collapse
        ghost
        items={[
          {
            key: 'advanced',
            label: t('config.advanced'),
            children: (
              <>
                <Field label={t('config.concurrency')}>
                  <InputNumber
                    className="w-full"
                    min={1}
                    max={caps?.maxConcurrent ?? 10}
                    value={config.concurrency}
                    onChange={(v) => onChange({ concurrency: v ?? 1 })}
                  />
                </Field>
                <Field label={t('config.maxCost')}>
                  <InputNumber
                    className="w-full"
                    min={0}
                    step={1}
                    value={config.maxCostPerRun}
                    onChange={(v) => onChange({ maxCostPerRun: v ?? undefined })}
                  />
                </Field>
                <Field label={t('config.maxJobs')}>
                  <InputNumber
                    className="w-full"
                    min={1}
                    value={config.maxJobsPerRun}
                    onChange={(v) => onChange({ maxJobsPerRun: v ?? undefined })}
                  />
                </Field>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
