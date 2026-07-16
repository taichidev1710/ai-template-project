/**
 * Diagram domain model — framework-agnostic (no React, no AntD).
 *
 * This is the single source of truth for the "sơ đồ quan hệ" feature. It
 * generalizes the demo (demo-sdqh) by separating FOUR orthogonal concepts the
 * demo conflated into one `level` field:
 *
 *   1. BlockType      — WHAT a node is (Person, Department, Task). Not ordered.
 *   2. Base relation  — an edge you actually draw & STORE (parent-of, reports-to).
 *   3. Derived relation — computed by composing base hops; NEVER stored (grandparent…).
 *   4. Rank/depth     — a node's position in the hierarchy; DERIVED, never declared.
 *
 * See DESIGN.md in this folder for the full rationale.
 */

/* ============================================================
   Catalog primitives — block types & relations
   ============================================================ */

export type NodeShape =
  | 'ellipse'
  | 'round-rectangle'
  | 'rectangle'
  | 'hexagon'
  | 'diamond'
  | 'triangle'
  | 'star'
  | 'barrel';

/** A classification of a node. Intrinsic — carries NO ordering. */
export interface BlockType {
  id: string;
  name: string;
  shape: NodeShape;
  color: string; // hex
}

export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dashdot' | 'longdash';
export type ArrowShape = 'none' | 'triangle' | 'vee';
export type CurveStyle = 'straight' | 'taxi' | 'bezier' | 'segments';

export interface RelationStyle {
  line: LineStyle;
  arrow: ArrowShape;
  curve: CurveStyle;
  color: string;
  width: number;
  animated?: boolean;
}

/**
 * `primary` = the structural backbone. Forms the tree; drives auto-layout,
 * branch collapse, and is the relation that derived relations are computed
 * over. `secondary` = a lateral link (spouse, friend, coordination) — stored
 * and drawn, but NOT part of the hierarchy. This replaces the demo's single
 * `hier` boolean with an explicit main/secondary (chính/phụ) role.
 */
export type RelationRole = 'primary' | 'secondary';

/** An edge type you draw by hand and store on the diagram. */
export interface BaseRelation {
  id: string;
  name: string;
  kind: 'base';
  role: RelationRole;
  style: RelationStyle;
}

/**
 * One hop along a base relation. `up` walks toward the edge SOURCE (parents);
 * `down` walks toward the edge TARGET (children). Edge orientation convention:
 * source is the parent, target is the child (arrow points at the child).
 */
export type PathStep = 'up' | 'down';

/** Which trivial matches to drop when computing a derived relation. */
export type DerivedExclusion = 'self' | 'parents' | 'children' | 'siblings';

/**
 * An edge type that is COMPUTED by composing base hops, never drawn by hand
 * and never stored. e.g. grandparent = ['up','up'] over the parent-child
 * relation; sibling = ['up','down'] excluding self. It still lives in the
 * catalog as a first-class relation (so it has a name + style + can be toggled
 * on the canvas) — the engine renders every node-pair that matches `pattern`.
 */
export interface DerivedRelation {
  id: string;
  name: string;
  kind: 'derived';
  /** The (usually primary) base relation whose edges the pattern walks over. */
  overRelationId: string;
  /** Sequence of hops, e.g. ['up','up'] (grandparent), ['up','down'] (sibling). */
  pattern: PathStep[];
  /** Trivial matches to drop (self is dropped by default even if omitted). */
  exclude?: DerivedExclusion[];
  style: RelationStyle;
  /** Whether the canvas shows this derived relation by default. */
  visibleByDefault?: boolean;
}

export type Relation = BaseRelation | DerivedRelation;

export function isBaseRelation(r: Relation): r is BaseRelation {
  return r.kind === 'base';
}
export function isDerivedRelation(r: Relation): r is DerivedRelation {
  return r.kind === 'derived';
}

/* ============================================================
   Rules — the constraint layer (5 types, matching the demo engine)
   ============================================================ */

export type RuleType = 'require' | 'limit' | 'ends' | 'chain' | 'same';
export type Direction = 'in' | 'out' | 'any';

/** `'*'` targets every block type. */
export type BlockTypeSelector = string | '*';

/** A node of `blockType` must have >= `min` links of `relation` in `dir`. */
export interface RequireRule {
  id: string;
  type: 'require';
  blockType: BlockTypeSelector;
  relation: string;
  dir: Direction;
  min: number;
}

/** A node of `blockType` may have at most `max` links of `relation` in `dir`. */
export interface LimitRule {
  id: string;
  type: 'limit';
  blockType: BlockTypeSelector;
  relation: string;
  dir: Direction;
  max: number;
}

/** `relation` edges may only connect a block type in `from` to one in `to`. */
export interface EndsRule {
  id: string;
  type: 'ends';
  relation: string;
  from: string[];
  to: string[];
}

/**
 * `relation` may only connect two block types that are ADJACENT in `order`
 * (source at i, target at i+1). This is sugar over `ends` for domains whose
 * block types form a linear tier order (e.g. org chart). Family does NOT need
 * this — its rank is emergent from the parent-child edges themselves.
 */
export interface ChainRule {
  id: string;
  type: 'chain';
  relation: string;
  order: string[]; // ordered block type ids
}

/** `relation` may only connect two nodes of the SAME block type. */
export interface SameRule {
  id: string;
  type: 'same';
  relation: string;
  blockTypes?: string[]; // if set, restrict to these block types
}

export type Rule = RequireRule | LimitRule | EndsRule | ChainRule | SameRule;

/** ends/chain/same are edge allow-lists; require/limit are node-degree checks. */
export const EDGE_RULE_TYPES: RuleType[] = ['ends', 'chain', 'same'];
export const NODE_RULE_TYPES: RuleType[] = ['require', 'limit'];

export interface RuleSet {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  builtin?: boolean;
  rules: Rule[];
}

/* ============================================================
   Diagram — nodes, edges, applied rule sets, visibility
   ============================================================ */

export interface DiagramNode {
  id: string;
  blockTypeId: string;
  label: string;
  /** Overrides the block type's default shape/color when set. */
  shape?: NodeShape;
  color?: string;
  image?: string | null;
  notes?: string;
  pos: { x: number; y: number };
  /** `exempt` opts a node out of `require` rules (demo's "chưa xác định"). */
  exempt?: boolean;
}

/** A stored edge. `relationId` MUST reference a base relation, never derived. */
export interface DiagramEdge {
  id: string;
  relationId: string;
  source: string;
  target: string;
  label?: string;
}

/** First-class view state: what is shown/hidden on the canvas. */
export interface DiagramVisibility {
  /** Block type ids whose nodes are hidden. */
  hiddenBlockTypes: string[];
  /** Relation ids (base or derived) that are hidden. */
  hiddenRelations: string[];
  /** Show computed derived relations (faint overlay). */
  showDerived: boolean;
  /** Show `secondary` (phụ) base relations. */
  showSecondary: boolean;
  /** Render edge labels. */
  edgeLabels: boolean;
  /** Node ids whose primary-relation subtree is collapsed. */
  collapsed: string[];
}

export function defaultVisibility(): DiagramVisibility {
  return {
    hiddenBlockTypes: [],
    hiddenRelations: [],
    showDerived: false,
    showSecondary: true,
    edgeLabels: true,
    collapsed: [],
  };
}

export interface Diagram {
  id: string;
  name: string;
  /** The template this diagram was seeded from (for reference only). */
  templateId?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** Applied rule sets — a diagram can apply MANY at once. */
  ruleSetIds: string[];
  /** Diagram-specific extra rules layered on top of the applied rule sets. */
  localRules: Rule[];
  visibility: DiagramVisibility;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   Catalog & template — the shared library (hybrid scope)
   ============================================================ */

/** The shared library of block types + relations any diagram/rule set can use. */
export interface Catalog {
  blockTypes: BlockType[];
  relations: Relation[];
}

/** A reusable bundle that seeds a new diagram's catalog + applied rule sets. */
export interface DiagramTemplate {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  builtin?: boolean;
  blockTypes: BlockType[];
  relations: Relation[];
  ruleSetIds: string[];
}

/* ============================================================
   Violations — output of the rule engine
   ============================================================ */

export interface Violation {
  kind: 'node' | 'edge';
  /** The offending node or edge id. */
  id: string;
  /** The rule that was violated. */
  ruleId: string;
  ruleType: RuleType;
  message: string;
}
