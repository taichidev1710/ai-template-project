import type { ListParams } from '@/shared/api';
import type { BlockType, NodeShape } from '@/domain/diagram';

export type { BlockType, NodeShape };

/** Payload for create/update. `id` is server-managed. */
export type BlockTypeInput = Omit<BlockType, 'id'>;

export type BlockTypesListParams = ListParams;

export type BlockTypesViewMode = 'table' | 'grid';

/** Selectable shapes, with a Vietnamese label for the form. */
export const SHAPE_OPTIONS: { value: NodeShape; label: string }[] = [
  { value: 'ellipse', label: 'Elip' },
  { value: 'round-rectangle', label: 'Chữ nhật bo' },
  { value: 'rectangle', label: 'Chữ nhật' },
  { value: 'hexagon', label: 'Lục giác' },
  { value: 'pentagon', label: 'Ngũ giác' },
  { value: 'octagon', label: 'Bát giác' },
  { value: 'diamond', label: 'Thoi' },
  { value: 'triangle', label: 'Tam giác' },
  { value: 'star', label: 'Sao' },
  { value: 'tag', label: 'Thẻ' },
  { value: 'rhomboid', label: 'Bình hành' },
  { value: 'barrel', label: 'Thùng' },
];

export function shapeLabel(shape: NodeShape): string {
  return SHAPE_OPTIONS.find((s) => s.value === shape)?.label ?? shape;
}
