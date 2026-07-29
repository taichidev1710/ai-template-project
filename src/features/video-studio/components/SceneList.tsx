import { Empty } from 'antd';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import type { AspectRatio, Character, Scene } from '@/domain/video';
import { SceneListItem } from './SceneListItem';

interface SceneListProps {
  scenes: Scene[];
  characters: readonly Character[];
  aspectOptions: readonly AspectRatio[];
  defaultAspect: AspectRatio;
  defaultCount: number;
  onReorder: (activeId: string, overId: string) => void;
  onSceneChange: (id: string, patch: Partial<Scene>) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onGenerate: (id: string) => void;
}

/** The reorderable scene list (spec §13.2). Drag-and-drop via @dnd-kit with the
 * built-in keyboard sensor, so ordering is accessible without a mouse. */
export function SceneList({
  scenes,
  characters,
  aspectOptions,
  defaultAspect,
  defaultCount,
  onReorder,
  onSceneChange,
  onDuplicate,
  onRemove,
  onGenerate,
}: SceneListProps) {
  const { t } = useTranslation('video-studio');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (scenes.length === 0) {
    return <Empty description={t('scene.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {scenes.map((scene) => (
          <SceneListItem
            key={scene.id}
            scene={scene}
            characters={characters}
            aspectOptions={aspectOptions}
            defaultAspect={defaultAspect}
            defaultCount={defaultCount}
            onChange={(patch) => onSceneChange(scene.id, patch)}
            onDuplicate={() => onDuplicate(scene.id)}
            onRemove={() => onRemove(scene.id)}
            onGenerate={() => onGenerate(scene.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
