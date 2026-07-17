import type {
  ChainRule,
  Direction,
  EndsRule,
  ForbidRule,
  LimitRule,
  RelationStep,
  RequireRule,
  Rule,
  RuleSet,
  RuleType,
  SameRule,
} from '@/domain/diagram';

export type { Rule, RuleSet, RuleType, Direction, RelationStep };

/** How a forbid rule names the relationship it bans. */
export type ForbidSource = 'when' | 'pattern';

/** Header fields of a rule set (its rules are edited one at a time). */
export type RuleSetInput = Pick<RuleSet, 'name' | 'icon' | 'description'>;

/** A rule without its id — what the rule builder produces. */
export type RuleInput =
  | Omit<RequireRule, 'id'>
  | Omit<LimitRule, 'id'>
  | Omit<EndsRule, 'id'>
  | Omit<ChainRule, 'id'>
  | Omit<SameRule, 'id'>
  | Omit<ForbidRule, 'id'>;

/** Domain-neutral labels (block/relation, never "level/cấp"). */
export const RULE_TYPE_OPTIONS: { value: RuleType; label: string; hint: string }[] = [
  { value: 'require', label: 'Bắt buộc có liên kết', hint: 'Một loại khối phải có ≥ N liên kết của một quan hệ' },
  { value: 'limit', label: 'Giới hạn số liên kết', hint: 'Một loại khối tối đa N liên kết của một quan hệ' },
  { value: 'ends', label: 'Ràng buộc hai đầu', hint: 'Quan hệ chỉ được nối từ nhóm khối A đến nhóm khối B' },
  { value: 'chain', label: 'Chuỗi liền kề', hint: 'Quan hệ chỉ nối các loại khối theo thứ tự A → B → C' },
  { value: 'same', label: 'Cùng loại', hint: 'Quan hệ chỉ nối 2 khối cùng loại' },
  { value: 'forbid', label: 'Cấm nối nếu đã có quan hệ khác', hint: 'Hai khối đã có sẵn quan hệ X thì KHÔNG được nối thêm quan hệ Y' },
];

export const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: 'in', label: 'liên kết đến (vào khối)' },
  { value: 'out', label: 'liên kết đi (ra khỏi khối)' },
  { value: 'any', label: 'bất kỳ chiều nào' },
];

export function ruleTypeLabel(type: RuleType): string {
  return RULE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function dirWord(d: Direction): string {
  return d === 'in' ? 'đến' : d === 'out' ? 'đi' : 'bất kỳ';
}

/** A readable one-line description of a rule, using friendly block/relation names. */
export function describeRule(r: Rule, blockName: (id: string) => string, relName: (id: string) => string): string {
  const node = (id: string) => (id === '*' ? 'Mọi khối' : blockName(id));
  switch (r.type) {
    case 'require':
      return `${node(r.blockType)} phải có ≥ ${r.min} liên kết “${relName(r.relation)}” (${dirWord(r.dir)})`;
    case 'limit':
      return `${node(r.blockType)} tối đa ${r.max} liên kết “${relName(r.relation)}” (${dirWord(r.dir)})`;
    case 'ends':
      return `“${relName(r.relation)}” chỉ nối [${r.from.map(blockName).join(', ')}] → [${r.to.map(blockName).join(', ')}]`;
    case 'chain':
      return `“${relName(r.relation)}” chỉ nối liền kề: ${r.order.map(blockName).join(' → ')}`;
    case 'same':
      return `“${relName(r.relation)}” chỉ nối 2 khối cùng loại${r.blockTypes?.length ? ` (${r.blockTypes.map(blockName).join(', ')})` : ''}`;
    case 'forbid': {
      const what = r.when
        ? `quan hệ “${relName(r.when)}”`
        : `đường đi ${(r.pattern ?? [])
            .map((s) => `${s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : '↔'}${relName(s.relationId)}`)
            .join(' → ') || '(chưa đặt)'}`;
      return `Cấm “${relName(r.relation)}” nếu 2 khối đã có ${what}`;
    }
  }
}
