/**
 * Domain → Cytoscape translation. Pure functions, no React and no `cy` instance,
 * so the mapping is unit-testable on its own.
 *
 * The dash patterns and curve names mirror the demo (demo-sdqh) so a diagram
 * drawn there looks identical here.
 */
import type {
  BlockType,
  CurveStyle,
  DiagramEdge,
  DiagramNode,
  LineStyle,
  Relation,
  RelationStyle,
} from '@/domain/diagram';

/** Cytoscape line-style + dash pattern for each domain LineStyle. */
interface LineSpec {
  dash: 'solid' | 'dashed' | 'dotted';
  pattern: number[];
  cap: 'butt' | 'round';
}

const LINE_SPECS: Record<LineStyle, LineSpec> = {
  solid: { dash: 'solid', pattern: [1], cap: 'butt' },
  dashed: { dash: 'dashed', pattern: [9, 5], cap: 'butt' },
  dotted: { dash: 'dotted', pattern: [2, 4], cap: 'round' },
  'dots-lg': { dash: 'dashed', pattern: [2, 9], cap: 'round' },
  longdash: { dash: 'dashed', pattern: [18, 7], cap: 'butt' },
  dashdot: { dash: 'dashed', pattern: [13, 5, 2, 5], cap: 'round' },
};

/** Cytoscape's curve-style names differ from the domain's. */
const CURVE_NAMES: Record<CurveStyle, string> = {
  straight: 'straight',
  taxi: 'taxi',
  bezier: 'unbundled-bezier',
  segments: 'segments',
};

export function lineSpec(line: LineStyle): LineSpec {
  return LINE_SPECS[line];
}

export function curveName(curve: CurveStyle): string {
  return CURVE_NAMES[curve];
}

/**
 * Flatten a RelationStyle into the `data` fields the stylesheet reads.
 *
 * `line` is passed through verbatim rather than expanded into dash/pattern/cap:
 * the stylesheet resolves it with one selector per line style, because
 * `line-dash-pattern` only accepts a literal array, never a mapper.
 */
export function edgeStyleData(style: RelationStyle) {
  return {
    curve: curveName(style.curve),
    line: style.line,
    arrow: style.arrow,
    color: style.color,
    width: style.width,
    animated: Boolean(style.animated),
  };
}

/**
 * Marching-ants is on if the edge overrides it, else it follows the relation.
 * `undefined` on the edge means inherit — only an explicit `false` turns off a
 * relation that animates by default.
 */
export function resolveAnimated(edge: Pick<DiagramEdge, 'animated'>, relation: Relation | undefined): boolean {
  return edge.animated ?? Boolean(relation?.style.animated);
}

export interface CyElementDef {
  group: 'nodes' | 'edges';
  data: Record<string, unknown>;
  position?: { x: number; y: number };
  classes?: string;
}

/**
 * A stored node. Per-node `shape`/`color` override the block type's default —
 * that is the domain's rule, so resolve it here rather than in the stylesheet.
 */
export function nodeDef(node: DiagramNode, blockType: BlockType | undefined): CyElementDef {
  return {
    group: 'nodes',
    data: {
      id: node.id,
      label: node.label,
      shape: node.shape ?? blockType?.shape ?? 'ellipse',
      color: node.color ?? blockType?.color ?? '#9aa1b3',
      blockTypeId: node.blockTypeId,
      ...(node.image ? { image: node.image } : {}),
      ...(node.exempt ? { unk: true } : {}),
    },
    position: { x: node.pos.x, y: node.pos.y },
  };
}

/** What an edge with no relation to lean on looks like. */
const ORPHAN_EDGE_STYLE: RelationStyle = {
  curve: 'straight',
  line: 'solid',
  arrow: 'triangle',
  color: '#5b647e',
  width: 2,
};

/**
 * A stored edge. `relation` must be a base relation (derived is never stored).
 * The edge's own `style` overrides win field by field over the relation's —
 * anything the edge does not pin keeps following its relation.
 */
export function edgeDef(edge: DiagramEdge, relation: Relation | undefined): CyElementDef {
  const style: RelationStyle = { ...(relation?.style ?? ORPHAN_EDGE_STYLE), ...edge.style };
  return {
    group: 'edges',
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ?? '',
      rel: edge.relationId,
      relName: relation?.name ?? '',
      ...edgeStyleData(style),
      // Must come after the spread: the edge's own flag wins over the relation's.
      animated: resolveAnimated(edge, relation),
    },
  };
}

/**
 * A computed derived edge — drawn faint, never stored, never hit-testable.
 * Id is prefixed so it can be removed wholesale without touching real edges.
 *
 * `relName` carries the label: a derived edge has no per-edge label of its own to
 * fall back FROM (nobody drew it), so without the relation's name the stylesheet
 * mapper resolves to '' and every derived link renders anonymous.
 */
export function derivedEdgeDef(
  relationId: string,
  source: string,
  target: string,
  style: RelationStyle,
  relName = '',
): CyElementDef {
  return {
    group: 'edges',
    classes: 'ghostedge',
    data: {
      id: `${DERIVED_PREFIX}${relationId}_${source}_${target}`,
      source,
      target,
      label: '',
      rel: relationId,
      relName,
      ...edgeStyleData(style),
    },
  };
}

export const DERIVED_PREFIX = 'gh_';
