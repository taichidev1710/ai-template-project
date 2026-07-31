import { useState } from 'react';
import { Card, Tag, Progress, Button, Typography, Space, Tooltip } from 'antd';
import {
  VideoCameraAddOutlined,
  ReloadOutlined,
  StopOutlined,
  CopyOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getCapabilities, sceneAssets, type AspectRatio, type Asset, type Job, type JobStatus, type RunConfig, type Scene } from '@/domain/video';
import { jobKey } from '../hooks/use-video-run';
import { assetTagLabel } from '../lib';
import { SceneOverrides } from './SceneOverrides';
import { SceneInfoModal } from './SceneInfoModal';

interface VideoCardProps {
  scene: Scene;
  count: number;
  jobs: Job[];
  config: RunConfig;
  assets: readonly Asset[];
  aspectOptions: readonly AspectRatio[];
  defaultAspect: AspectRatio;
  defaultCount: number;
  onGenerate: () => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onCopyPath: (path: string) => void;
  onOverrideChange: (patch: Partial<Pick<Scene, 'aspectOverride' | 'countOverride'>>) => void;
}

const STATUS_COLOR: Record<JobStatus, string> = {
  queued: 'default',
  processing: 'processing',
  success: 'success',
  error: 'error',
  canceled: 'default',
};

/** One preview card per scene, with a row per variant (spec §13.3). */
export function VideoCard({
  scene,
  count,
  jobs,
  config,
  assets,
  aspectOptions,
  defaultAspect,
  defaultCount,
  onGenerate,
  onRetry,
  onCancel,
  onCopyPath,
  onOverrideChange,
}: VideoCardProps) {
  const { t } = useTranslation('video-studio');
  const [infoOpen, setInfoOpen] = useState(false);
  const isImage = getCapabilities(config.providerId)?.kind === 'image';
  const byIndex = new Map(jobs.map((j) => [j.index, j]));
  const effectiveAspect = scene.aspectOverride ?? defaultAspect;
  const usedAssets = sceneAssets(scene, assets);

  return (
    <>
    <Card
      size="small"
      className="!border-line !shadow-sm transition-shadow hover:!shadow-md"
      title={
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-app-sm bg-primary px-1.5 text-sm font-semibold text-white">
          #{scene.order}
        </span>
      }
      extra={
        <Space size={0}>
          <Tooltip title={t('info.view')}>
            <Button type="text" size="small" icon={<InfoCircleOutlined />} onClick={() => setInfoOpen(true)} />
          </Tooltip>
          <Button size="small" type="primary" ghost icon={<VideoCameraAddOutlined />} onClick={onGenerate}>
            {isImage ? t('grid.generateImage') : t('grid.generate')}
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph ellipsis={{ rows: 2 }} className="!mb-2 text-sm text-ink">
        {scene.text || '—'}
      </Typography.Paragraph>

      {usedAssets.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {usedAssets.map((a) => (
            <Tag key={a.id} color={a.color} variant="filled">
              {assetTagLabel(a, t)}
            </Tag>
          ))}
        </div>
      )}

      <div className="mb-2">
        <SceneOverrides
          defaultAspect={defaultAspect}
          defaultCount={defaultCount}
          aspectOverride={scene.aspectOverride}
          countOverride={scene.countOverride}
          aspectOptions={aspectOptions}
          onChange={onOverrideChange}
        />
      </div>

      <Space orientation="vertical" size={6} className="w-full">
        {Array.from({ length: count }, (_, i) => {
          const job = byIndex.get(i);
          const key = jobKey(scene.id, i);
          const status = job?.status;
          return (
            <div key={i} className="flex min-w-0 items-center gap-2">
              <Typography.Text type="secondary" className="shrink-0 text-xs" style={{ width: 62 }}>
                {t('grid.variant', { n: i + 1 })}
              </Typography.Text>

              {status ? (
                <Tag color={STATUS_COLOR[status]} className="!m-0 shrink-0">
                  {t(`grid.status.${status}`)}
                </Tag>
              ) : (
                <Tag className="!m-0 shrink-0">—</Tag>
              )}

              {status === 'processing' && (
                <Progress percent={job?.progress ?? 0} size="small" className="!m-0 min-w-0 flex-1" />
              )}

              {status === 'success' && job?.previewUrl && (
                <a
                  href={job.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                  title={t('grid.viewImage')}
                >
                  <img
                    src={job.previewUrl}
                    alt=""
                    className="h-10 w-10 rounded-app-sm border border-line object-cover"
                  />
                </a>
              )}

              {status === 'success' && job?.outputPath && (
                <>
                  <Tooltip title={job.outputPath}>
                    <Typography.Text type="secondary" className="min-w-0 flex-1 truncate text-xs">
                      {job.outputPath}
                    </Typography.Text>
                  </Tooltip>
                  <Button
                    type="text"
                    size="small"
                    className="shrink-0"
                    icon={<CopyOutlined />}
                    onClick={() => onCopyPath(job.outputPath!)}
                    aria-label={t('grid.copyPath')}
                  />
                </>
              )}

              {status === 'error' && (
                <>
                  {job?.error && (
                    <Tooltip title={job.error.message || t(`error.${job.error.code}`)}>
                      <Typography.Text type="danger" className="min-w-0 flex-1 truncate text-xs">
                        {job.error.message || t(`error.${job.error.code}`)}
                      </Typography.Text>
                    </Tooltip>
                  )}
                  <Button
                    type="text"
                    size="small"
                    className="shrink-0"
                    icon={<ReloadOutlined />}
                    onClick={() => onRetry(key)}
                  >
                    {t('grid.retry')}
                  </Button>
                </>
              )}

              {(status === 'queued' || status === 'processing') && (
                <Button
                  type="text"
                  size="small"
                  danger
                  className="shrink-0"
                  icon={<StopOutlined />}
                  onClick={() => onCancel(key)}
                  aria-label={t('grid.cancel')}
                />
              )}
            </div>
          );
        })}
      </Space>
    </Card>
    <SceneInfoModal
      open={infoOpen}
      scene={scene}
      config={config}
      assets={assets}
      aspect={effectiveAspect}
      count={count}
      onClose={() => setInfoOpen(false)}
    />
    </>
  );
}
