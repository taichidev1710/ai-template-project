import { Modal, Descriptions, Tag, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  getCapabilities,
  sceneAssets,
  type AspectRatio,
  type Asset,
  type RunConfig,
  type Scene,
  type SpeedTier,
} from '@/domain/video';

interface SceneInfoModalProps {
  open: boolean;
  scene: Scene;
  config: RunConfig;
  assets: readonly Asset[];
  aspect: AspectRatio;
  count: number;
  onClose: () => void;
}

/** Read-only "what would be used to generate this scene" panel (spec §13.3). */
export function SceneInfoModal({ open, scene, config, assets, aspect, count, onClose }: SceneInfoModalProps) {
  const { t } = useTranslation('video-studio');
  const caps = getCapabilities(config.providerId);
  const used = sceneAssets(scene, assets);

  const speedLabel: Record<SpeedTier, string> = {
    fast: t('config.speedFast'),
    normal: t('config.speedNormal'),
    quality: t('config.speedQuality'),
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={`${t('info.title')} · #${scene.order}`}
      width={520}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Descriptions
        column={1}
        size="small"
        bordered
        items={[
          { key: 'prompt', label: t('info.rawPrompt'), children: scene.text || '—' },
          { key: 'provider', label: t('info.provider'), children: caps?.label ?? config.providerId },
          {
            key: 'model',
            label: t('info.model'),
            children: <Typography.Text code>{config.modelId || '—'}</Typography.Text>,
          },
          { key: 'speed', label: t('info.speed'), children: speedLabel[config.speed] },
          { key: 'aspect', label: t('info.aspect'), children: aspect },
          {
            key: 'duration',
            label: t('info.duration'),
            children: caps?.kind === 'video' ? t('info.seconds', { n: config.durationSeconds }) : '—',
          },
          { key: 'audio', label: t('info.audio'), children: config.audio ? t('info.on') : t('info.off') },
          { key: 'seed', label: t('info.seed'), children: config.seed ?? t('info.randomSeed') },
          { key: 'count', label: t('info.count'), children: count },
          {
            key: 'assets',
            label: t('info.assets'),
            children:
              used.length > 0 ? (
                <Space wrap size={4}>
                  {used.map((a) => (
                    <Tag key={a.id} color={a.color} variant="filled" className="!m-0">
                      {a.kind === 'character' ? `@${a.key}` : a.displayName || a.key || '—'}
                      {a.images.length > 0 ? ` · ${t('info.refImages', { n: a.images.length })}` : ''}
                    </Tag>
                  ))}
                </Space>
              ) : (
                t('info.noAssets')
              ),
          },
        ]}
      />
    </Modal>
  );
}
