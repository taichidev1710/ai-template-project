import type { ListParams } from '@/shared/api';
import type {
  ArrowShape,
  BaseRelation,
  CurveStyle,
  DerivedExclusion,
  DerivedRelation,
  LineStyle,
  PathStep,
  Relation,
  RelationRole,
} from '@/domain/diagram';

export type { Relation, BaseRelation, DerivedRelation, PathStep, DerivedExclusion, RelationRole };

/** Create/update payloads — id is server-managed; kind picks the variant. */
export type BaseRelationInput = Omit<BaseRelation, 'id'>;
export type DerivedRelationInput = Omit<DerivedRelation, 'id'>;
export type RelationInput = BaseRelationInput | DerivedRelationInput;

export type RelationsListParams = ListParams;
export type RelationsViewMode = 'table' | 'grid';

export const LINE_OPTIONS: { value: LineStyle; label: string }[] = [
  { value: 'solid', label: 'Nét liền' },
  { value: 'dashed', label: 'Nét đứt' },
  { value: 'dotted', label: 'Chấm' },
  { value: 'dashdot', label: 'Gạch-chấm' },
  { value: 'longdash', label: 'Gạch dài' },
];

export const ARROW_OPTIONS: { value: ArrowShape; label: string }[] = [
  { value: 'triangle', label: 'Tam giác' },
  { value: 'vee', label: 'Mũi tên' },
  { value: 'none', label: 'Không mũi' },
];

export const CURVE_OPTIONS: { value: CurveStyle; label: string }[] = [
  { value: 'straight', label: 'Thẳng' },
  { value: 'taxi', label: 'Bậc thang' },
  { value: 'bezier', label: 'Cong' },
  { value: 'segments', label: 'Gấp khúc' },
];

export const ROLE_OPTIONS: { value: RelationRole; label: string }[] = [
  { value: 'primary', label: 'Chính (xương sống)' },
  { value: 'secondary', label: 'Phụ (ngang)' },
];

export const EXCLUDE_OPTIONS: { value: DerivedExclusion; label: string }[] = [
  { value: 'parents', label: 'Cha mẹ' },
  { value: 'children', label: 'Con' },
  { value: 'siblings', label: 'Anh chị em' },
];

export function roleLabel(role: RelationRole): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

/** Human-readable path, e.g. ['up','up'] → "↑ ↑". */
export function patternText(pattern: PathStep[]): string {
  return pattern.map((s) => (s === 'up' ? '↑' : '↓')).join(' ') || '—';
}
