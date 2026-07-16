/**
 * Built-in presets — a GENERAL diagram tool, not a family tool.
 *
 * The engine (types/rules/derive) knows nothing about "Person" or "family".
 * These templates are just seed bundles of {block types + relations + rule
 * sets}; they stand as equals. A user builds any diagram type by defining their
 * own bundle (DiagramTemplate) — or starting from "Tự do" and adding pieces.
 *
 * Derived relations are generic too: over an org's "reports-to" relation,
 * ['up','up'] means "skip-level manager"; over a network's "connects-to",
 * ['down','down'] means "reachable in 2 hops". Same engine, different data.
 */
import type { BlockType, DiagramTemplate, Relation, RelationStep, RuleSet } from './types';

/* Path-step shorthands for derived relations. */
const up = (relationId: string): RelationStep => ({ relationId, dir: 'up' });
const down = (relationId: string): RelationStep => ({ relationId, dir: 'down' });
const both = (relationId: string): RelationStep => ({ relationId, dir: 'both' });

/* Relation-style shorthands. */
const solid = (color: string, arrow: 'triangle' | 'vee' | 'none' = 'triangle', curve: 'straight' | 'taxi' = 'straight') =>
  ({ line: 'solid' as const, arrow, curve, color, width: 2.5 });
const dashed = (color: string) =>
  ({ line: 'dashed' as const, arrow: 'none' as const, curve: 'straight' as const, color, width: 2 });
const faint = (color: string) =>
  ({ line: 'dotted' as const, arrow: 'none' as const, curve: 'bezier' as const, color, width: 1.5 });

/* ============================================================
   Family — one block type, emergent generations, derived kin
   ============================================================ */
const FAMILY_BLOCKS: BlockType[] = [
  { id: 'bt_person', name: 'Người', shape: 'ellipse', color: '#5fb99a' },
  { id: 'bt_unknown', name: 'Chưa xác định', shape: 'hexagon', color: '#9aa1b3' },
];
const FAMILY_RELATIONS: Relation[] = [
  { id: 'rel_parent', name: 'Cha mẹ – con', kind: 'base', role: 'primary', style: solid('#5b647e') },
  { id: 'rel_spouse', name: 'Vợ chồng', kind: 'base', role: 'secondary', style: dashed('#c46ba0') },
  { id: 'rel_friend', name: 'Bạn bè', kind: 'base', role: 'secondary', style: dashed('#6fb1d8') },
  { id: 'der_grandparent', name: 'Ông bà (suy ra)', kind: 'derived', pattern: [up('rel_parent'), up('rel_parent')], style: faint('#b08d6a') },
  { id: 'der_grandchild', name: 'Cháu (suy ra)', kind: 'derived', pattern: [down('rel_parent'), down('rel_parent')], style: faint('#d97b6c') },
  { id: 'der_sibling', name: 'Anh chị em (suy ra)', kind: 'derived', pattern: [up('rel_parent'), down('rel_parent')], exclude: ['self'], style: faint('#5fb99a') },
  { id: 'der_uncle', name: 'Cô/dì/chú/bác (suy ra)', kind: 'derived', pattern: [up('rel_parent'), up('rel_parent'), down('rel_parent')], exclude: ['self', 'parents'], style: faint('#7d8cc4') },
  { id: 'der_child_in_law', name: 'Con dâu/rể (suy ra)', kind: 'derived', pattern: [down('rel_parent'), both('rel_spouse')], exclude: ['self'], style: faint('#c46ba0') },
];
const RS_FAMILY: RuleSet = {
  id: 'rs_family', name: 'Gia đình chuẩn', icon: '👪', builtin: true,
  description: 'Mỗi khối tối đa 2 liên kết cha mẹ và (trừ “Chưa xác định”) cần đủ 2; vợ chồng tối đa 1 và cùng loại.',
  rules: [
    { id: 'rf_limit_parent', type: 'limit', blockType: '*', relation: 'rel_parent', dir: 'in', max: 2 },
    { id: 'rf_require_parent', type: 'require', blockType: 'bt_person', relation: 'rel_parent', dir: 'in', min: 2 },
    { id: 'rf_limit_spouse', type: 'limit', blockType: '*', relation: 'rel_spouse', dir: 'any', max: 1 },
    { id: 'rf_same_spouse', type: 'same', relation: 'rel_spouse', blockTypes: ['bt_person'] },
  ],
};

/* ============================================================
   Organization — ordered tiers (chain rule) + derived skip-level
   ============================================================ */
const ORG_BLOCKS: BlockType[] = [
  { id: 'bt_company', name: 'Công ty', shape: 'barrel', color: '#e0a94e' },
  { id: 'bt_dept', name: 'Phòng ban', shape: 'hexagon', color: '#7d8cc4' },
  { id: 'bt_manager', name: 'Quản lý', shape: 'round-rectangle', color: '#5fb99a' },
  { id: 'bt_employee', name: 'Nhân viên', shape: 'ellipse', color: '#6fb1d8' },
];
const ORG_RELATIONS: Relation[] = [
  { id: 'rel_reports', name: 'Trực thuộc', kind: 'base', role: 'primary', style: solid('#5b647e', 'triangle', 'taxi') },
  { id: 'rel_coord', name: 'Phối hợp', kind: 'base', role: 'secondary', style: dashed('#a5c46b') },
  { id: 'der_skiplevel', name: 'Sếp cách cấp (suy ra)', kind: 'derived', pattern: [up('rel_reports'), up('rel_reports')], style: faint('#b08d6a') },
];
const RS_ORG: RuleSet = {
  id: 'rs_org', name: 'Tổ chức — thống nhất mệnh lệnh', icon: '🏢', builtin: true,
  description: 'Mỗi cấp trực thuộc đúng 1 cấp trên; “Trực thuộc” chỉ nối các tầng liền kề Công ty→Phòng ban→Quản lý→Nhân viên.',
  rules: [
    { id: 'ro_limit', type: 'limit', blockType: '*', relation: 'rel_reports', dir: 'in', max: 1 },
    { id: 'ro_chain', type: 'chain', relation: 'rel_reports', order: ['bt_company', 'bt_dept', 'bt_manager', 'bt_employee'] },
    { id: 'ro_require', type: 'require', blockType: 'bt_employee', relation: 'rel_reports', dir: 'in', min: 1 },
  ],
};

/* ============================================================
   School — tiers + lateral relations
   ============================================================ */
const SCHOOL_BLOCKS: BlockType[] = [
  { id: 'bt_school', name: 'Trường', shape: 'barrel', color: '#e0a94e' },
  { id: 'bt_class', name: 'Lớp', shape: 'hexagon', color: '#7d8cc4' },
  { id: 'bt_teacher', name: 'Giáo viên', shape: 'round-rectangle', color: '#5fb99a' },
  { id: 'bt_student', name: 'Học sinh', shape: 'ellipse', color: '#6fb1d8' },
  { id: 'bt_parent', name: 'Phụ huynh', shape: 'diamond', color: '#c46ba0' },
];
const SCHOOL_RELATIONS: Relation[] = [
  { id: 'rel_belongs', name: 'Trực thuộc', kind: 'base', role: 'primary', style: solid('#5b647e', 'triangle', 'taxi') },
  { id: 'rel_teach', name: 'Chủ nhiệm', kind: 'base', role: 'secondary', style: solid('#5fb99a', 'vee') },
  { id: 'rel_guardian', name: 'Phụ huynh của', kind: 'base', role: 'secondary', style: dashed('#c46ba0') },
];
const RS_SCHOOL: RuleSet = {
  id: 'rs_school', name: 'Trường học chuẩn', icon: '🏫', builtin: true,
  description: 'Lớp trực thuộc trường; mỗi lớp đúng 1 giáo viên chủ nhiệm; học sinh học đúng 1 lớp.',
  rules: [
    { id: 'rc_ends', type: 'ends', relation: 'rel_belongs', from: ['bt_school', 'bt_class'], to: ['bt_class', 'bt_student'] },
    { id: 'rc_teach_limit', type: 'limit', blockType: 'bt_class', relation: 'rel_teach', dir: 'in', max: 1 },
    { id: 'rc_student_limit', type: 'limit', blockType: 'bt_student', relation: 'rel_belongs', dir: 'out', max: 1 },
  ],
};

/* ============================================================
   Process / flow — free-form directed steps
   ============================================================ */
const PROCESS_BLOCKS: BlockType[] = [
  { id: 'bt_start', name: 'Bắt đầu', shape: 'ellipse', color: '#5fb99a' },
  { id: 'bt_step', name: 'Bước', shape: 'round-rectangle', color: '#6fb1d8' },
  { id: 'bt_gate', name: 'Điều kiện', shape: 'diamond', color: '#e0a94e' },
  { id: 'bt_end', name: 'Kết thúc', shape: 'ellipse', color: '#d97b6c' },
];
const PROCESS_RELATIONS: Relation[] = [
  { id: 'rel_flow', name: 'Luồng tới', kind: 'base', role: 'primary', style: solid('#5b647e', 'triangle', 'taxi') },
];

/* ============================================================
   Network — undirected-ish graph, derived "reachable in 2 hops"
   ============================================================ */
const NETWORK_BLOCKS: BlockType[] = [
  { id: 'bt_net_node', name: 'Nút', shape: 'ellipse', color: '#7d8cc4' },
];
const NETWORK_RELATIONS: Relation[] = [
  { id: 'rel_conn', name: 'Kết nối', kind: 'base', role: 'primary', style: solid('#5b647e', 'none') },
  { id: 'der_2hop', name: 'Tới sau 2 bước (suy ra)', kind: 'derived', pattern: [down('rel_conn'), down('rel_conn')], exclude: ['self'], style: faint('#b08d6a') },
];

/* ============================================================
   Mind map — central idea branching out
   ============================================================ */
const MINDMAP_BLOCKS: BlockType[] = [
  { id: 'bt_mm_central', name: 'Ý trung tâm', shape: 'star', color: '#e0a94e' },
  { id: 'bt_mm_main', name: 'Nhánh chính', shape: 'round-rectangle', color: '#5fb99a' },
  { id: 'bt_mm_sub', name: 'Nhánh phụ', shape: 'ellipse', color: '#6fb1d8' },
];
const MINDMAP_RELATIONS: Relation[] = [
  { id: 'rel_branch', name: 'Phân nhánh', kind: 'base', role: 'primary', style: solid('#5b647e', 'none') },
];

/* ============================================================
   Free — no rules, minimal catalog
   ============================================================ */
const FREE_BLOCKS: BlockType[] = [
  { id: 'bt_free_a', name: 'Nhóm chính', shape: 'ellipse', color: '#e0a94e' },
  { id: 'bt_free_b', name: 'Nhóm phụ', shape: 'round-rectangle', color: '#5fb99a' },
];
const FREE_RELATIONS: Relation[] = [
  { id: 'rel_free_main', name: 'Liên kết chính', kind: 'base', role: 'primary', style: solid('#5b647e') },
  { id: 'rel_free_sub', name: 'Liên kết phụ', kind: 'base', role: 'secondary', style: dashed('#9aa1b3') },
];

/* ============================================================
   Public seed data
   ============================================================ */
export const BUILTIN_RULE_SETS: RuleSet[] = [RS_FAMILY, RS_ORG, RS_SCHOOL];

export const BUILTIN_TEMPLATES: DiagramTemplate[] = [
  { id: 'tpl_org', name: 'Tổ chức', icon: '🏢', builtin: true, description: 'Các tầng có thứ tự với luật chuỗi liền kề; suy ra “sếp cách cấp”.', blockTypes: ORG_BLOCKS, relations: ORG_RELATIONS, ruleSets: [RS_ORG] },
  { id: 'tpl_school', name: 'Trường học', icon: '🏫', builtin: true, description: 'Trường → Lớp → Học sinh; chủ nhiệm & phụ huynh là quan hệ phụ.', blockTypes: SCHOOL_BLOCKS, relations: SCHOOL_RELATIONS, ruleSets: [RS_SCHOOL] },
  { id: 'tpl_process', name: 'Quy trình / Flow', icon: '🔀', builtin: true, description: 'Luồng có hướng qua các bước và điều kiện — không ràng buộc.', blockTypes: PROCESS_BLOCKS, relations: PROCESS_RELATIONS, ruleSets: [] },
  { id: 'tpl_network', name: 'Mạng lưới', icon: '🕸️', builtin: true, description: 'Đồ thị kết nối; suy ra “tới sau 2 bước”.', blockTypes: NETWORK_BLOCKS, relations: NETWORK_RELATIONS, ruleSets: [] },
  { id: 'tpl_mindmap', name: 'Sơ đồ tư duy', icon: '🧠', builtin: true, description: 'Ý trung tâm phân nhánh — không ràng buộc.', blockTypes: MINDMAP_BLOCKS, relations: MINDMAP_RELATIONS, ruleSets: [] },
  { id: 'tpl_family', name: 'Gia đình', icon: '👪', builtin: true, description: 'Một loại khối “Người”; thế hệ suy ra từ chuỗi cha–con; họ hàng là quan hệ suy ra.', blockTypes: FAMILY_BLOCKS, relations: FAMILY_RELATIONS, ruleSets: [RS_FAMILY] },
  { id: 'tpl_free', name: 'Tự do (không luật)', icon: '✨', builtin: true, description: 'Vẽ thoải mái — tự thêm loại khối / quan hệ / luật nếu muốn.', blockTypes: FREE_BLOCKS, relations: FREE_RELATIONS, ruleSets: [] },
];

/** Convenience flattened views (deduped by id) — handy for tests/tools. */
export const BUILTIN_BLOCK_TYPES: BlockType[] = dedupe(BUILTIN_TEMPLATES.flatMap((t) => t.blockTypes));
export const BUILTIN_RELATIONS: Relation[] = dedupe(BUILTIN_TEMPLATES.flatMap((t) => t.relations));

function dedupe<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const it of items) if (!seen.has(it.id)) seen.set(it.id, it);
  return [...seen.values()];
}
