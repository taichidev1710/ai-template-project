import { Card, Input, Button, Space, Tag, Tooltip, Typography } from 'antd';
import { HolderOutlined, CopyOutlined, DeleteOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import type { AspectRatio, Character, Scene } from '@/domain/video';
import { SceneOverrides } from './SceneOverrides';

interface SceneListItemProps {
  scene: Scene;
  characters: readonly Character[];
  aspectOptions: readonly AspectRatio[];
  defaultAspect: AspectRatio;
  defaultCount: number;
  onChange: (patch: Partial<Scene>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onGenerate: () => void;
}

/** One draggable scene row (spec §13.2). Reorder via the handle; overrides per card. */
export function SceneListItem({
  scene,
  characters,
  aspectOptions,
  defaultAspect,
  defaultCount,
  onChange,
  onDuplicate,
  onRemove,
  onGenerate,
}: SceneListItemProps) {
  const { t } = useTranslation('video-studio');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const colorByKey = new Map(characters.map((c) => [c.key.toLowerCase(), c]));
  const assignedAssets = characters.filter((c) => scene.assetIds?.includes(c.id));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="mb-3"
    >
      <Card
        size="small"
        title={
          <Space>
            <Button
              type="text"
              size="small"
              icon={<HolderOutlined />}
              aria-label={t('scene.dragHint')}
              className="cursor-grab"
              {...attributes}
              {...listeners}
            />
            <Typography.Text strong>#{scene.order}</Typography.Text>
          </Space>
        }
        extra={
          <Space size={0}>
            <Tooltip title={t('grid.generate')}>
              <Button type="text" size="small" icon={<VideoCameraAddOutlined />} onClick={onGenerate} />
            </Tooltip>
            <Tooltip title={t('scene.duplicate')}>
              <Button type="text" size="small" icon={<CopyOutlined />} onClick={onDuplicate} />
            </Tooltip>
            <Tooltip title={t('scene.remove')}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
            </Tooltip>
          </Space>
        }
      >
        <Input.TextArea
          value={scene.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={t('scene.textPlaceholder')}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <div className="mt-2">
          <SceneOverrides
            defaultAspect={defaultAspect}
            defaultCount={defaultCount}
            aspectOverride={scene.aspectOverride}
            countOverride={scene.countOverride}
            aspectOptions={aspectOptions}
            onChange={onChange}
          />
        </div>
        {(scene.characterKeys.length > 0 || assignedAssets.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {scene.characterKeys.map((key) => (
              <Tag key={`k-${key}`} color={colorByKey.get(key)?.color} variant="filled">
                @{key}
              </Tag>
            ))}
            {assignedAssets
              .filter((a) => !scene.characterKeys.includes(a.key.toLowerCase()))
              .map((a) => (
                <Tag key={a.id} color={a.color} variant="filled">
                  {a.displayName || a.key || '—'}
                </Tag>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
