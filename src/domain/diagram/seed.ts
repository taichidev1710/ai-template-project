/**
 * Built-in presets — the generalized rewrite of the demo's templates.
 *
 * The headline change vs the demo: the FAMILY template no longer declares a
 * block type per generation (Kị/Cụ/Ông…). It has ONE block type "Người"; a
 * node's generation is EMERGENT (its depth along the parent-child relation),
 * and grandparent/sibling/uncle are DERIVED relations (path patterns), not
 * stored edges. The ORG template keeps ordered tiers to show the other regime
 * (a `chain` rule over ordered block types).
 */
import type { BlockType, DiagramTemplate, Relation, RuleSet } from './types';

/* Reusable relation-style shorthands. */
const solid = (color: string, arrow: 'triangle' | 'vee' | 'none' = 'triangle') =>
  ({ line: 'solid' as const, arrow, curve: 'straight' as const, color, width: 2.5 });
const dashed = (color: string) =>
  ({ line: 'dashed' as const, arrow: 'none' as const, curve: 'straight' as const, color, width: 2 });
const faint = (color: string) =>
  ({ line: 'dotted' as const, arrow: 'none' as const, curve: 'bezier' as const, color, width: 1.5 });

/* ============================================================
   Family (generalized) — one block type, emergent generations
   ============================================================ */

const FAMILY_BLOCKS: BlockType[] = [
  { id: 'bt_person', name: 'Người', shape: 'ellipse', color: '#5fb99a' },
  // Lets you satisfy "2 parents" when one parent is unknown; exempt from require.
  { id: 'bt_unknown', name: 'Chưa xác định', shape: 'hexagon', color: '#9aa1b3' },
];

const FAMILY_RELATIONS: Relation[] = [
  { id: 'rel_parent', name: 'Cha mẹ – con', kind: 'base', role: 'primary', style: solid('#5b647e') },
  { id: 'rel_spouse', name: 'Vợ chồng', kind: 'base', role: 'secondary', style: dashed('#c46ba0') },
  { id: 'rel_friend', name: 'Bạn bè', kind: 'base', role: 'secondary', style: dashed('#6fb1d8') },
  // Derived — computed over rel_parent, never drawn by hand:
  {
    id: 'der_grandparent', name: 'Ông bà (suy ra)', kind: 'derived',
    overRelationId: 'rel_parent', pattern: ['up', 'up'], style: faint('#b08d6a'), visibleByDefault: false,
  },
  {
    id: 'der_grandchild', name: 'Cháu (suy ra)', kind: 'derived',
    overRelationId: 'rel_parent', pattern: ['down', 'down'], style: faint('#d97b6c'), visibleByDefault: false,
  },
  {
    id: 'der_sibling', name: 'Anh chị em (suy ra)', kind: 'derived',
    overRelationId: 'rel_parent', pattern: ['up', 'down'], exclude: ['self'], style: faint('#5fb99a'), visibleByDefault: false,
  },
  {
    id: 'der_uncle', name: 'Cô/dì/chú/bác (suy ra)', kind: 'derived',
    overRelationId: 'rel_parent', pattern: ['up', 'up', 'down'], exclude: ['self', 'parents'], style: faint('#7d8cc4'), visibleByDefault: false,
  },
];

const RS_FAMILY: RuleSet = {
  id: 'rs_family',
  name: 'Gia đình chuẩn',
  icon: '👪',
  builtin: true,
  description:
    'Mỗi người tối đa 2 cha mẹ và (trừ khối “Chưa xác định”) cần đủ cả 2; vợ chồng tối đa 1 và nối 2 người cùng loại.',
  rules: [
    { id: 'rf_limit_parent', type: 'limit', blockType: '*', relation: 'rel_parent', dir: 'in', max: 2 },
    { id: 'rf_require_parent', type: 'require', blockType: 'bt_person', relation: 'rel_parent', dir: 'in', min: 2 },
    { id: 'rf_limit_spouse', type: 'limit', blockType: '*', relation: 'rel_spouse', dir: 'any', max: 1 },
    { id: 'rf_same_spouse', type: 'same', relation: 'rel_spouse', blockTypes: ['bt_person'] },
  ],
};

/* ============================================================
   Organization — ordered tiers (chain rule regime)
   ============================================================ */

const ORG_BLOCKS: BlockType[] = [
  { id: 'bt_company', name: 'Công ty', shape: 'barrel', color: '#e0a94e' },
  { id: 'bt_dept', name: 'Phòng ban', shape: 'hexagon', color: '#7d8cc4' },
  { id: 'bt_manager', name: 'Quản lý', shape: 'round-rectangle', color: '#5fb99a' },
  { id: 'bt_employee', name: 'Nhân viên', shape: 'ellipse', color: '#6fb1d8' },
];

const ORG_RELATIONS: Relation[] = [
  { id: 'rel_reports', name: 'Trực thuộc', kind: 'base', role: 'primary', style: { ...solid('#5b647e'), curve: 'taxi' } },
  { id: 'rel_coord', name: 'Phối hợp', kind: 'base', role: 'secondary', style: dashed('#a5c46b') },
];

const RS_ORG: RuleSet = {
  id: 'rs_org',
  name: 'Tổ chức — thống nhất mệnh lệnh',
  icon: '🏢',
  builtin: true,
  description: 'Mỗi cấp chỉ trực thuộc đúng 1 cấp trên; “Trực thuộc” chỉ nối các tầng liền kề Công ty→Phòng ban→Quản lý→Nhân viên.',
  rules: [
    { id: 'ro_limit', type: 'limit', blockType: '*', relation: 'rel_reports', dir: 'in', max: 1 },
    { id: 'ro_chain', type: 'chain', relation: 'rel_reports', order: ['bt_company', 'bt_dept', 'bt_manager', 'bt_employee'] },
    { id: 'ro_require', type: 'require', blockType: 'bt_employee', relation: 'rel_reports', dir: 'in', min: 1 },
  ],
};

/* ============================================================
   Free — no rules, minimal catalog
   ============================================================ */

const FREE_BLOCKS: BlockType[] = [
  { id: 'bt_main', name: 'Nhóm chính', shape: 'ellipse', color: '#e0a94e' },
  { id: 'bt_sub', name: 'Nhóm phụ', shape: 'round-rectangle', color: '#5fb99a' },
];

const FREE_RELATIONS: Relation[] = [
  { id: 'rel_main', name: 'Liên kết chính', kind: 'base', role: 'primary', style: solid('#5b647e') },
  { id: 'rel_sub', name: 'Liên kết phụ', kind: 'base', role: 'secondary', style: dashed('#9aa1b3') },
];

/* ============================================================
   Public seed data
   ============================================================ */

export const BUILTIN_RULE_SETS: RuleSet[] = [RS_FAMILY, RS_ORG];

export const BUILTIN_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'tpl_family', name: 'Gia đình', icon: '👪', builtin: true,
    description: 'Một loại khối “Người”; thế hệ suy ra từ chuỗi cha–con; ông bà / anh chị em / cô chú là quan hệ suy ra.',
    blockTypes: FAMILY_BLOCKS, relations: FAMILY_RELATIONS, ruleSetIds: ['rs_family'],
  },
  {
    id: 'tpl_org', name: 'Công ty / Tổ chức', icon: '🏢', builtin: true,
    description: 'Các tầng có thứ tự (Công ty→Phòng ban→Quản lý→Nhân viên) với luật chuỗi liền kề.',
    blockTypes: ORG_BLOCKS, relations: ORG_RELATIONS, ruleSetIds: ['rs_org'],
  },
  {
    id: 'tpl_free', name: 'Tự do (không luật)', icon: '✨', builtin: true,
    description: 'Vẽ thoải mái — tự thêm loại khối / quan hệ / luật nếu muốn.',
    blockTypes: FREE_BLOCKS, relations: FREE_RELATIONS, ruleSetIds: [],
  },
];
