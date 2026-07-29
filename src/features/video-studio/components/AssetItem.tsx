import type { ReactNode } from 'react';
import { Input, ColorPicker, Upload, Button, Tag, Select, Typography } from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BgColorsOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
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

/** Icon per kind — the kind is FIXED at creation (chosen by the "Add …" button),
 * so this row shows it read-only instead of a switcher (spec §2.3). */
const KIND_ICON: Record<AssetKind, ReactNode> = {
  character: <UserOutlined />,
  setting: <EnvironmentOutlined />,
  style: <BgColorsOutlined />,
  prompt: <FileTextOutlined />,
};

const KIND_LABEL_KEY: Record<AssetKind, string> = {
  character: 'asset.kindCharacter',
  setting: 'asset.kindSetting',
  style: 'asset.kindStyle',
  prompt: 'asset.kindPrompt',
};

/** A tiny labelled field wrapper so each control reads clearly (spec §13.5). */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <Typography.Text type="secondary" className="text-xs">
        {label}
      </Typography.Text>
      {children}
    </label>
  );
}

/** One asset row. The kind is set when created and never switched here. `character`
 * / `setting` / `style` carry reference images and/or a text description; `prompt`
 * is a text-only block applied to scenes (spec §2.3, §9). */
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
  const isPrompt = asset.kind === 'prompt';

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

  const descLabel = isPrompt
    ? t('asset.promptContent')
    : asset.kind === 'style'
      ? t('asset.descStyle')
      : t('asset.descOptional');

  return (
    <div className="mb-3 rounded-app border border-line-soft bg-canvas p-3">
      {/* Header: read-only kind + remove */}
      <div className="mb-2 flex items-center justify-between">
        <Tag color={asset.color} variant="filled" className="!m-0">
          <span className="mr-1">{KIND_ICON[asset.kind]}</span>
          {t(KIND_LABEL_KEY[asset.kind])}
        </Tag>
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          aria-label={t('character.remove')}
        />
      </div>

      {isPrompt ? (
        <Field label={t('asset.promptNameLabel')}>
          <Input
            size="small"
            placeholder={t('asset.promptNamePlaceholder')}
            value={asset.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </Field>
      ) : (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2">
          <Field label={t('asset.colorLabel')}>
            <ColorPicker
              value={asset.color}
              onChange={(c) => onChange({ color: c.toHexString() })}
              size="small"
            />
          </Field>
          <Field label={t('asset.nameLabel')}>
            <Input
              size="small"
              placeholder={t('character.namePlaceholder')}
              value={asset.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
            />
          </Field>
          <div className="col-span-2">
            <Field label={t('asset.keyLabel')}>
              <Input
                size="small"
                prefix="@"
                placeholder={t('character.keyPlaceholder')}
                value={asset.key}
                onChange={(e) => onChange({ key: e.target.value.trim().toLowerCase() })}
              />
            </Field>
            <Typography.Text type="secondary" className="mt-1 block text-xs">
              {t('asset.keyHelp')}
            </Typography.Text>
          </div>
        </div>
      )}

      {/* Reference images (not for prompt kind) */}
      {!isPrompt && (
        <div className="mt-2">
          <Typography.Text type="secondary" className="mb-1 block text-xs">
            {t('asset.imagesLabel')}
          </Typography.Text>
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
          <Typography.Text type="secondary" className="block text-xs">
            {t('asset.imagesHelp')}
          </Typography.Text>
        </div>
      )}

      {/* Text description / prompt content — usable with OR instead of an image */}
      <div className="mt-2">
        <Field label={descLabel}>
          <Input.TextArea
            size="small"
            autoSize={{ minRows: isPrompt ? 3 : 2, maxRows: 8 }}
            placeholder={isPrompt ? t('asset.promptContentPlaceholder') : t('asset.descPlaceholder')}
            value={asset.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
      </div>

      {/* Which scenes this asset is used in */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {usedSceneOrders.length > 0 ? (
          <>
            <Typography.Text type="secondary" className="text-xs">
              {t('asset.usedScenes')}
            </Typography.Text>
            {usedSceneOrders.map((o) => (
              <Tag key={o} color="blue" variant="filled" className="!m-0">
                #{o}
              </Tag>
            ))}
          </>
        ) : (
          <Tag className="!m-0">{t('asset.notUsed')}</Tag>
        )}
      </div>

      {/* Assign this asset to scenes (works for any kind). */}
      <div className="mt-2">
        <Field label={t('asset.assignScenes')}>
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
        </Field>
      </div>
    </div>
  );
}
