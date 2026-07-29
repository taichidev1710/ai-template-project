import { Empty, Alert, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { AspectRatio, Asset, Job, RunConfig, Scene } from '@/domain/video';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  scenes: Scene[];
  jobs: Record<string, Job>;
  config: RunConfig;
  assets: readonly Asset[];
  aspectOptions: readonly AspectRatio[];
  onGenerate: (sceneId: string) => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onCopyPath: (path: string) => void;
  onSceneChange: (id: string, patch: Partial<Scene>) => void;
}

/** Right column — a preview card per scene (spec §13.3). */
export function VideoGrid({
  scenes,
  jobs,
  config,
  assets,
  aspectOptions,
  onGenerate,
  onRetry,
  onCancel,
  onCopyPath,
  onSceneChange,
}: VideoGridProps) {
  const { t } = useTranslation('video-studio');

  if (scenes.length === 0) {
    return <Empty description={t('grid.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const jobsList = Object.values(jobs);

  return (
    <div>
      <Alert type="info" showIcon className="mb-3" title={<span className="text-xs">{t('grid.openHint')}</span>} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {scenes.map((scene) => (
          <VideoCard
            key={scene.id}
            scene={scene}
            count={scene.countOverride ?? config.count}
            jobs={jobsList.filter((j) => j.sceneId === scene.id)}
            config={config}
            assets={assets}
            aspectOptions={aspectOptions}
            defaultAspect={config.aspect}
            defaultCount={config.count}
            onGenerate={() => onGenerate(scene.id)}
            onRetry={onRetry}
            onCancel={onCancel}
            onCopyPath={onCopyPath}
            onOverrideChange={(patch) => onSceneChange(scene.id, patch)}
          />
        ))}
      </div>
      <Typography.Text type="secondary" className="mt-2 block text-xs">
        {t('prompt.sceneCount', { n: scenes.length })}
      </Typography.Text>
    </div>
  );
}
