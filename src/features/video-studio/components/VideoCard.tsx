import { Card, Tag, Progress, Button, Typography, Space, Tooltip } from 'antd';
import { VideoCameraAddOutlined, ReloadOutlined, StopOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Job, JobStatus, Scene } from '@/domain/video';
import { jobKey } from '../hooks/use-video-run';

interface VideoCardProps {
  scene: Scene;
  count: number;
  jobs: Job[];
  onGenerate: () => void;
  onRetry: (key: string) => void;
  onCancel: (key: string) => void;
  onCopyPath: (path: string) => void;
}

const STATUS_COLOR: Record<JobStatus, string> = {
  queued: 'default',
  processing: 'processing',
  success: 'success',
  error: 'error',
  canceled: 'default',
};

/** One preview card per scene, with a row per variant (spec §13.3). */
export function VideoCard({ scene, count, jobs, onGenerate, onRetry, onCancel, onCopyPath }: VideoCardProps) {
  const { t } = useTranslation('video-studio');
  const byIndex = new Map(jobs.map((j) => [j.index, j]));

  return (
    <Card
      size="small"
      title={<Typography.Text strong>#{scene.order}</Typography.Text>}
      extra={
        <Button size="small" icon={<VideoCameraAddOutlined />} onClick={onGenerate}>
          {t('grid.generate')}
        </Button>
      }
    >
      <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }} className="!mb-2 text-xs">
        {scene.text || '—'}
      </Typography.Paragraph>

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
                    <Tooltip title={t(`error.${job.error.code}`)}>
                      <Typography.Text type="danger" className="min-w-0 flex-1 truncate text-xs">
                        {t(`error.${job.error.code}`)}
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
  );
}
