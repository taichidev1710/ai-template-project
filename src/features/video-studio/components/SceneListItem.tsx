import { Card, Input, Select, Button, Space, Tag, Tooltip, Typography } from 'antd';
import { HolderOutlined, CopyOutlined, DeleteOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import type { AspectRatio, Character, Scene } from '@/domain/video';

interface SceneListItemProps {
  scene: Scene;
  characters: readonly Character[];
  aspectOptions: readonly AspectRatio[];
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
  onChange,
  onDuplicate,
  onRemove,
  onGenerate,
}: SceneListItemProps) {
  const { t } = useTranslation('video-studio');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });

  const colorByKey = new Map(characters.map((c) => [c.key.toLowerCase(), c]));

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
            <Tooltip title={t('scene.characters')}>
              <span className="mr-2">
                {scene.characterKeys.map((key) => {
                  const c = colorByKey.get(key);
                  return (
                    <Tag key={key} color={c?.color} bordered={false}>
                      @{key}
                    </Tag>
                  );
                })}
              </span>
            </Tooltip>
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
        <div className="mt-2 flex flex-wrap gap-2">
          <Select
            size="small"
            allowClear
            placeholder={t('scene.aspectOverride')}
            style={{ minWidth: 120 }}
            value={scene.aspectOverride}
            onChange={(v?: AspectRatio) => onChange({ aspectOverride: v })}
            options={aspectOptions.map((a) => ({ value: a, label: a }))}
          />
          <Select
            size="small"
            allowClear
            placeholder={t('scene.countOverride')}
            style={{ minWidth: 120 }}
            value={scene.countOverride}
            onChange={(v?: number) => onChange({ countOverride: v })}
            options={[1, 2, 3, 4].map((n) => ({ value: n, label: `×${n}` }))}
          />
        </div>
      </Card>
    </div>
  );
}
