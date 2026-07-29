import { Input, ColorPicker, Upload, Button, Space, Tag, Segmented, Select, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Asset, AssetKind } from '@/domain/video';

interface AssetItemProps {
  asset: Asset;
  /** Scene ORDERS this asset is used in (via @key in prompt OR assignment). */
  usedSceneOrders: number[];
  scenes: { id: string; order: number }[];
  /** Scene ids this asset is currently assigned to (from each scene's assetIds). */
  assignedSceneIds: string[];
  onChange: (patch: Partial<Asset>) => void;
  onRemove: () => void;
  onAssignScenes: (sceneIds: string[]) => void;
}

/** One asset row: kind, @key, name, colour, images, and (for settings/styles) the
 * scenes it is applied to (spec §2.3, §9). */
export function AssetItem({
  asset,
  usedSceneOrders,
  scenes,
  assignedSceneIds,
  onChange,
  onRemove,
  onAssignScenes,
}: AssetItemProps) {
  const { t } = useTranslation('video-studio');

  const fileList: UploadFile[] = asset.images.map((url, i) => ({
    uid: String(i),
    name: `img-${i}`,
    status: 'done',
    url,
  }));

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange({ images: [...asset.images, String(reader.result)] });
    reader.readAsDataURL(file);
    return Upload.LIST_IGNORE; // we control fileList ourselves
  };

  const removeImage = (file: UploadFile) => {
    const idx = Number(file.uid);
    onChange({ images: asset.images.filter((_, i) => i !== idx) });
  };

  const kindOptions = [
    { value: 'character', label: t('asset.kindCharacter') },
    { value: 'setting', label: t('asset.kindSetting') },
    { value: 'style', label: t('asset.kindStyle') },
  ];

  return (
    <div className="mb-3 rounded-app bg-canvas p-3">
      <div className="mb-2">
        <Segmented
          size="small"
          value={asset.kind}
          onChange={(v) => onChange({ kind: v as AssetKind })}
          options={kindOptions}
        />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <ColorPicker value={asset.color} onChange={(c) => onChange({ color: c.toHexString() })} size="small" />
        <Input
          size="small"
          prefix="@"
          placeholder={t('character.keyPlaceholder')}
          value={asset.key}
          onChange={(e) => onChange({ key: e.target.value.trim().toLowerCase() })}
          style={{ width: 110 }}
        />
        <Input
          size="small"
          placeholder={t('character.namePlaceholder')}
          value={asset.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
        />
        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onRemove} aria-label={t('character.remove')} />
      </div>
      <Space align="center" wrap>
        <Upload
          listType="picture-card"
          accept="image/*"
          fileList={fileList}
          beforeUpload={beforeUpload}
          onRemove={removeImage}
        >
          <div className="text-xs">
            <PlusOutlined />
            <div>{t('character.upload')}</div>
          </div>
        </Upload>
        {usedSceneOrders.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1">
            <Typography.Text type="secondary" className="text-xs">
              {t('asset.usedScenes')}
            </Typography.Text>
            {usedSceneOrders.map((o) => (
              <Tag key={o} color="blue" variant="filled" className="!m-0">
                #{o}
              </Tag>
            ))}
          </span>
        ) : (
          <Tag>{t('asset.notUsed')}</Tag>
        )}
      </Space>

      {/* Attach this asset to scenes directly (works for any kind — characters can
          be @key'd in the prompt too, spec decision). */}
      <div className="mt-2">
        <Typography.Text type="secondary" className="mb-1 block text-xs">
          {t('asset.assignScenes')}
        </Typography.Text>
        <Select
          mode="multiple"
          size="small"
          className="w-full"
          placeholder={t('asset.assignPlaceholder')}
          value={assignedSceneIds}
          onChange={onAssignScenes}
          options={scenes.map((s) => ({ value: s.id, label: `#${s.order}` }))}
          disabled={scenes.length === 0}
        />
      </div>
    </div>
  );
}
