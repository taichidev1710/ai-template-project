import { Button, Empty, Alert, Space, Typography } from 'antd';
import {
  UserAddOutlined,
  EnvironmentOutlined,
  BgColorsOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Asset, AssetKind, AssetIssue, AssetIssueCode } from '@/domain/video';
import { AssetItem } from './AssetItem';

interface AssetPanelProps {
  assets: Asset[];
  /** assetId → scene ORDERS it is used in (via @key or assignment). */
  usedScenes: Record<string, number[]>;
  issues: AssetIssue[];
  scenes: { id: string; order: number }[];
  /** assetId → scene ids it is assigned to (from each scene's assetIds). */
  assignedByAsset: Record<string, string[]>;
  onAdd: (kind: AssetKind) => void;
  onChange: (id: string, patch: Partial<Asset>) => void;
  onRemove: (id: string) => void;
  onAssignScenes: (assetId: string, sceneIds: string[]) => void;
}

/** Maps a domain issue code to its i18n key (domain returns codes, UI translates). */
const ISSUE_KEY: Record<AssetIssueCode, string> = {
  'missing-image': 'asset.issue.missingImage',
  'unused-asset': 'asset.issue.unusedAsset',
  'unknown-key': 'asset.issue.unknownKey',
};

/** Reference-asset roster: characters (via @key) + settings/styles (assigned to
 * scenes) + reusable prompt blocks, plus consistency warnings (spec §2.3, §9). */
export function AssetPanel({
  assets,
  usedScenes,
  issues,
  scenes,
  assignedByAsset,
  onAdd,
  onChange,
  onRemove,
  onAssignScenes,
}: AssetPanelProps) {
  const { t } = useTranslation('video-studio');

  const kindLabel: Record<AssetKind, string> = {
    character: t('asset.kindCharacter'),
    setting: t('asset.kindSetting'),
    style: t('asset.kindStyle'),
    prompt: t('asset.kindPrompt'),
  };

  /** A human label for an issue: `@key` for characters/unknown keys, else the
   * asset's name (falling back to its kind) — so prompt/style rows read clearly. */
  const issueLabel = (issue: AssetIssue): string => {
    const asset = issue.assetId ? assets.find((a) => a.id === issue.assetId) : undefined;
    if (!asset) return `@${issue.key}`;
    if (asset.kind === 'character') return `@${asset.key}`;
    return asset.displayName || (asset.key ? `@${asset.key}` : kindLabel[asset.kind]);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap justify-end gap-2">
        <Button size="small" icon={<UserAddOutlined />} onClick={() => onAdd('character')}>
          {t('asset.addCharacter')}
        </Button>
        <Button size="small" icon={<EnvironmentOutlined />} onClick={() => onAdd('setting')}>
          {t('asset.addSetting')}
        </Button>
        <Button size="small" icon={<BgColorsOutlined />} onClick={() => onAdd('style')}>
          {t('asset.addStyle')}
        </Button>
        <Button size="small" icon={<FileTextOutlined />} onClick={() => onAdd('prompt')}>
          {t('asset.addPrompt')}
        </Button>
      </div>

      {assets.length === 0 ? (
        <Empty description={t('asset.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        assets.map((a) => (
          <AssetItem
            key={a.id}
            asset={a}
            usedSceneOrders={usedScenes[a.id] ?? []}
            scenes={scenes}
            assignedSceneIds={assignedByAsset[a.id] ?? []}
            onChange={(patch) => onChange(a.id, patch)}
            onRemove={() => onRemove(a.id)}
            onAssignScenes={(sceneIds) => onAssignScenes(a.id, sceneIds)}
          />
        ))
      )}

      {issues.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="mt-2"
          title={
            <Space orientation="vertical" size={0}>
              {issues.map((issue, i) => (
                <Typography.Text key={`${issue.code}-${issue.key}-${i}`} className="text-xs">
                  {t(ISSUE_KEY[issue.code], { label: issueLabel(issue), key: issue.key })}
                </Typography.Text>
              ))}
            </Space>
          }
        />
      )}
    </div>
  );
}
