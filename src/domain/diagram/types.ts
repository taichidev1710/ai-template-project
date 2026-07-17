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
  /**
   * The edge has NO direction: A→B and B→A are one link, not two. Vợ chồng, bạn
   * bè, phối hợp — drawing it back the other way says the same thing twice.
   *
   * Left off, source→target points somewhere on purpose and the reverse is a
   * DIFFERENT fact the author may well want: a flow step that loops back to an
   * earlier one is a second, real edge, not a duplicate of the first.
   *
   * Graph vocabulary, not domain vocabulary — the engine learns only that the
   * two ends are interchangeable, never what they hold. It is the same thing a
   * derived pattern already says with `dir: 'both'`, said where an EDGE can read
   * it; nothing else on a relation implies it (`role`, and the arrowhead in
   * `style`, are about backbone and looks — a plain line is still directed).
   */
  symmetric?: boolean;
  style: RelationStyle;
}

/**
 * Direction of a hop along a base relation. `up` walks toward the edge SOURCE
 * (parents); `down` toward the TARGET (children); `both` follows the edge in
 * either direction — for SYMMETRIC relations with no parent/child orientation
 * (e.g. spouse). Edge convention: source is the parent, target is the child.
 */
export type StepDir = 'up' | 'down' | 'both';

/**
 * One hop in a derived-relation path: which base relation to walk and which
 * way. Because each step names its OWN relation, a pattern can MIX relations —
 * e.g. daughter/son-in-law = [down over parent-child, both over spouse].
 */
export interface RelationStep {
  relationId: string;
  dir: StepDir;
}

/** Which trivial matches to drop when computing a derived relation. */
export type DerivedExclusion = 'self' | 'parents' | 'children' | 'siblings';

/**
 * An edge type that is COMPUTED by composing base hops, never drawn by hand
 * and never stored. Grandparent = two up-hops over parent-child; sibling = up
 * then down (exclude self); daughter-in-law = down over parent-child then a
 * both-hop over spouse. It still lives in the catalog as a first-class relation
 * (name + style + toggle) — the engine renders every pair matching `pattern`.
 */
export interface DerivedRelation {
  id: string;
  name: string;
  kind: 'derived';
  /** Ordered hops. Each step names its relation, so patterns may mix relations. */
  pattern: RelationStep[];
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
   Rules — the constraint layer (6 types: the demo's 5, plus `forbid`)
   ============================================================ */

export type RuleType = 'require' | 'limit' | 'ends' | 'chain' | 'same' | 'forbid';
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

/**
 * `relation` may NOT join two blocks that `when` ALREADY connects — "no marrying
 * anyone you are a sibling of".
 *
 * Two things make this rule unlike the other five:
 *
 *  1. It reads the GRAPH, not block types. The others can say "Người may marry
 *     Người"; none can say "…but not your own sister", because being someone's
 *     sister is a PATH, not a type.
 *  2. It FORBIDS. ends/chain/same are an OR allow-list, so folding this in with
 *     them would let an edge through the moment it satisfied `same` alone. It
 *     runs separately, as a veto over whatever the allow-list permitted.
 *
 * The relationship is named ONE of two ways, and `when` is the one to reach for:
 *
 *  - `when` NAMES a relation of this same Loại sơ đồ — base (“Cha mẹ – con”, an
 *    edge really there) or derived (“Anh chị em (suy ra)”, a path computed).
 *    This is §7 working as intended: the rule talks about vocabulary the type
 *    declared, so the very thing being banned is also nameable, reusable across
 *    rules, and VISIBLE — toggle it on and the canvas draws who is affected.
 *  - `pattern` spells the hops out inline, for a relationship the catalog has no
 *    name for. The escape hatch, not the default: what it describes cannot be
 *    drawn, cannot be reused, and no one but this rule knows it exists. If the
 *    same path shows up twice, it wanted to be a derived relation.
 *
 * Set both and `when` wins. Set neither and the rule matches nothing.
 *
 * Either way the check runs in BOTH directions, so a symmetric relation cannot
 * slip through by being drawn the other way round.
 *
 * The engine stays domain-neutral: it never learns what a “đời” is, it only asks
 * whether these two are already related that way. Over an org chart the same
 * rule reads “no coordinating with someone under your own manager”.
 */
export interface ForbidRule {
  id: string;
  type: 'forbid';
  relation: string;
  when?: string;
  pattern?: RelationStep[];
}

export type Rule = RequireRule | LimitRule | EndsRule | ChainRule | SameRule | ForbidRule;

/** ends/chain/same are edge allow-lists; require/limit are node-degree checks. */
export const EDGE_RULE_TYPES: RuleType[] = ['ends', 'chain', 'same'];
export const NODE_RULE_TYPES: RuleType[] = ['require', 'limit'];
/** Vetoes, applied on top of the allow-list — never OR'd into it. */
export const EDGE_DENY_RULE_TYPES: RuleType[] = ['forbid'];

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
  /**
   * Overrides the relation's `style.animated` for THIS edge only. The relation
   * owns the rest of the style (see DESIGN.md §7); marching-ants is the one
   * per-edge exception, so a single link can be called out without restyling
   * every link of its kind. `undefined` = inherit the relation's default.
   */
  animated?: boolean;
}

/** First-class view state: what is shown/hidden on the canvas. */
export interface DiagramVisibility {
  /** Block type ids whose nodes are hidden. */
  hiddenBlockTypes: string[];
  /** Relation ids (base or derived) that are hidden. */
  hiddenRelations: string[];
  /**
   * Relation ids drawn WITHOUT their label. Separate from `hiddenRelations`:
   * on a dense diagram the lines are the point and the labels are the clutter,
   * so muting the text has to be possible without losing the link itself.
   */
  hiddenLabels: string[];
  /** Show computed derived relations (faint overlay). */
  showDerived: boolean;
  /** Show `secondary` (phụ) base relations. */
  showSecondary: boolean;
  /** Master switch over every label; `hiddenLabels` then mutes them per relation. */
  edgeLabels: boolean;
  /** Node ids whose primary-relation subtree is collapsed. */
  collapsed: string[];
}

export function defaultVisibility(): DiagramVisibility {
  return {
    hiddenBlockTypes: [],
    hiddenRelations: [],
    hiddenLabels: [],
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

/**
 * "Loại sơ đồ" — the SELF-CONTAINED authoring bundle and the owner of a
 * diagram's vocabulary. It holds its own block types + relations + rule sets;
 * rules inside those rule sets reference THIS type's block types/relations. A
 * diagram picks a type and applies a subset of its rule sets. Owning the
 * vocabulary here (not on each rule set) keeps "apply many rule sets" clean.
 */
export interface DiagramTemplate {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  builtin?: boolean;
  blockTypes: BlockType[];
  relations: Relation[];
  ruleSets: RuleSet[];
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
