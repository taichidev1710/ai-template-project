import { Input, ColorPicker, Upload, Button, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Character } from '@/domain/video';

interface CharacterItemProps {
  character: Character;
  usedCount: number;
  onChange: (patch: Partial<Character>) => void;
  onRemove: () => void;
}

/** One character row: @key, name, colour, reference images (spec §9.1, §13.2). */
export function CharacterItem({ character, usedCount, onChange, onRemove }: CharacterItemProps) {
  const { t } = useTranslation('video-studio');

  const fileList: UploadFile[] = character.images.map((url, i) => ({
    uid: String(i),
    name: `img-${i}`,
    status: 'done',
    url,
  }));

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange({ images: [...character.images, String(reader.result)] });
    reader.readAsDataURL(file);
    return Upload.LIST_IGNORE; // we control fileList ourselves
  };

  const removeImage = (file: UploadFile) => {
    const idx = Number(file.uid);
    onChange({ images: character.images.filter((_, i) => i !== idx) });
  };

  return (
    <div className="mb-3 rounded-app bg-canvas p-3">
      <div className="mb-2 flex items-center gap-2">
        <ColorPicker
          value={character.color}
          onChange={(c) => onChange({ color: c.toHexString() })}
          size="small"
        />
        <Input
          size="small"
          prefix="@"
          placeholder={t('character.keyPlaceholder')}
          value={character.key}
          onChange={(e) => onChange({ key: e.target.value.trim().toLowerCase() })}
          style={{ width: 110 }}
        />
        <Input
          size="small"
          placeholder={t('character.namePlaceholder')}
          value={character.displayName}
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
        <Tag color={usedCount > 0 ? 'blue' : 'default'}>
          {usedCount > 0 ? t('character.usedIn', { n: usedCount }) : t('character.unused')}
        </Tag>
      </Space>
      {!character.key && (
        <Typography.Text type="secondary" className="text-xs">
          {t('character.key')}
        </Typography.Text>
      )}
    </div>
  );
}
