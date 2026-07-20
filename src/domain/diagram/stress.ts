/**
 * Stress-data generator — big AND rule-abiding.
 *
 * `generateSample` proves every edge with `edgeWouldViolate`; that guard costs
 * a scan of the whole diagram per edge, so at thousands of blocks it turns
 * quadratic (and with `forbid` rules, far worse). This generator gets the same
 * outcome a different way, in linear time:
 *
 *   1. CONSTRUCT within the rules — the tier path, the allowed pairs, the
 *      parents each child takes, the lateral pairs are all read through the
 *      SAME readers `generateSample` uses (`tierPath`/`pairsFor`/`requireMin`/
 *      `limitMax`), and per-node degree bookkeeping enforces every `limit`.
 *      No rule is guessed; what the rules do not say is not invented.
 *   2. SCRUB what construction cannot see — `forbid` judges the whole graph,
 *      so the result is validated ONCE at the end (cheap since the degree
 *      index) and any edge still named by a violation is dropped.
 *
 * Deterministic by construction — no RNG at all — so the same request builds
 * the same diagram and a perf comparison across code changes measures the
 * code, not the dice.
 */
import { validate } from './rules';
import { limitMax, pairsFor, requireMin, selectedRules, tierPath, type Pair } from './sample';
import type { SampleContent } from './sample';
import {
  defaultVisibility,
  isBaseRelation,
  type Diagram,
  type DiagramEdge,
  type DiagramNode,
  type DiagramTemplate,
  type Direction,
  type Rule,
} from './types';

const COL_GAP = 130;
const ROW_GAP = 150;
/** Vertical gap between one tier's band of rows and the next tier's. */
const TIER_GAP = 260;
/** Each next tier is ~this many times wider — the bulk lands on the last tier. */
const TIER_RATIO = 6;
/** Lateral links: 5% of the block count, but never more than this. */
const MAX_PEER_EDGES = 300;
/** The first lateral edges animate, so the ants loop is part of the exercise. */
const ANIMATED_PEERS = 25;
export const MAX_STRESS_BLOCKS = 20000;

/**
 * `count` blocks obeying the applied rule sets: a tree over the primary
 * relation shaped by the rules (tier types from the allowed pairs, parents per
 * child from require/limit), plus lateral links where the rules allow them.
 * A template with no base relation gets a plain grid of unlinked blocks —
 * there is nothing the vocabulary lets us join them with.
 */
export function generateStress(template: DiagramTemplate, ruleSetIds: string[] | undefined, count: number): SampleContent {
  const { blockTypes } = template;
  if (blockTypes.length === 0) return { nodes: [], edges: [] };
  const n = Math.max(1, Math.min(MAX_STRESS_BLOCKS, Math.floor(count)));
  const rules = selectedRules(template, ruleSetIds);
  const bases = template.relations.filter(isBaseRelation);
  const primary = bases.find((r) => r.role === 'primary') ?? bases[0];

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const counters = new Map<string, number>();
  const addNode = (blockTypeId: string, x: number, y: number): DiagramNode => {
    const c = (counters.get(blockTypeId) ?? 0) + 1;
    counters.set(blockTypeId, c);
    const node: DiagramNode = {
      id: `sn_${nodes.length + 1}`,
      blockTypeId,
      label: `${blockTypes.find((b) => b.id === blockTypeId)?.name ?? 'Khối'} ${c}`,
      pos: { x: Math.round(x), y: Math.round(y) },
    };
    nodes.push(node);
    return node;
  };

  /** Degree bookkeeping — how `limit` stays honored without per-edge scans. */
  const degrees = new Map<string, { in: number; out: number }>();
  const degreeAt = (nodeId: string) => {
    let d = degrees.get(nodeId);
    if (!d) {
      d = { in: 0, out: 0 };
      degrees.set(nodeId, d);
    }
    return d;
  };
  const withinLimit = (node: DiagramNode, relation: string, gaining: Direction): boolean => {
    const d = degreeAt(node.id);
    const next = { in: d.in + (gaining === 'in' ? 1 : 0), out: d.out + (gaining === 'out' ? 1 : 0) };
    return (
      next.in <= limitMax(node.blockTypeId, relation, 'in', rules) &&
      next.out <= limitMax(node.blockTypeId, relation, 'out', rules) &&
      next.in + next.out <= limitMax(node.blockTypeId, relation, 'any', rules)
    );
  };
  // NOTE: the bookkeeping is per PRIMARY-or-lateral relation id below; degrees
  // here key on node only because each pass links one relation at a time and
  // resets between passes.
  const resetDegrees = () => degrees.clear();

  const link = (prefix: string, relationId: string, source: DiagramNode, target: DiagramNode, animated?: boolean) => {
    edges.push({
      id: `${prefix}_${edges.length + 1}`,
      relationId,
      source: source.id,
      target: target.id,
      ...(animated ? { animated: true } : {}),
    });
    degreeAt(source.id).out += 1;
    degreeAt(target.id).in += 1;
  };

  /* ---- 1. the primary tree, tiers shaped by the rules --------------------- */

  const path = primary ? tierPath(blockTypes, primary.id, rules) : [];
  const tiers: DiagramNode[][] = [];

  if (primary && path.length > 0) {
    /** Parents each node of tier `t` takes — `generateSample`'s own reading. */
    const parentsPerNode = (t: number): number => {
      const bt = path[t];
      if (!bt || t === 0) return 0;
      const need = Math.max(requireMin(bt, primary.id, 'in', rules), 1);
      const cap = Math.min(limitMax(bt, primary.id, 'in', rules), limitMax(bt, primary.id, 'any', rules));
      return Math.max(1, Math.min(need, cap));
    };

    // Tier widths: geometric toward the last tier, which absorbs the exact
    // remainder so the output holds precisely `n` blocks. The root tier follows
    // the sample's couple logic — `k` parents per tier-1 node means tier 0 is
    // `k` roots for EACH of them (their own group); one parent means one root.
    const L = path.length;
    const k1 = parentsPerNode(1);
    const weights = Array.from({ length: L }, (_, t) => TIER_RATIO ** t);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => Math.max(1, Math.floor((n * w) / weightSum)));
    if (L > 1 && k1 >= 2) widths[0] = (widths[1] ?? 1) * k1;
    else widths[0] = L > 1 ? 1 : n;
    const allButLast = widths.slice(0, -1).reduce((a, b) => a + b, 0);
    widths[L - 1] = Math.max(1, n - allButLast);

    // Lay each tier as a wrapped band of rows: a 15 000-strong tier as ONE row
    // would be a million-pixel ribbon nobody can pan across.
    const wrap = Math.max(10, Math.ceil(Math.sqrt(n) * 1.3));
    let bandY = 0;
    // The plan above can only overshoot (each tier is forced ≥ 1, the root may
    // widen for couples), so a running budget clamps it back to exactly `n`.
    let remaining = n;
    for (let t = 0; t < L && remaining > 0; t++) {
      const bt = path[t];
      const width = Math.min(widths[t] ?? 1, remaining);
      remaining -= width;
      if (!bt) break;
      const row: DiagramNode[] = [];
      const cols = Math.min(width, wrap);
      for (let i = 0; i < width; i++) {
        row.push(addNode(bt, ((i % cols) - (cols - 1) / 2) * COL_GAP, bandY + Math.floor(i / cols) * ROW_GAP));
      }
      bandY += Math.ceil(width / cols) * ROW_GAP + TIER_GAP;
      tiers.push(row);

      const prev = tiers[t - 1];
      if (t > 0 && prev) {
        const k = parentsPerNode(t);
        const groupCount = Math.max(1, Math.floor(prev.length / k));
        row.forEach((child, i) => {
          // Round-robin over consecutive parent groups — the sample's exact
          // trick, so co-parents stay a couple and neighbours stay unrelated.
          const group = prev.slice((i % groupCount) * k, (i % groupCount) * k + k);
          // A parent out of `limit` headroom takes no more children; the child
          // then leans on the next group over rather than going orphaned.
          const ok = group.length === k && group.every((p) => withinLimit(p, primary.id, 'out'));
          const fallback = ok ? group : prev.filter((p) => withinLimit(p, primary.id, 'out')).slice(0, k);
          for (const parent of ok ? group : fallback) link('se', primary.id, parent, child);
        });
      }
    }
  } else {
    // No relation to build a tree with: a grid still measures raw rendering.
    const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.4)));
    const bt = blockTypes[0];
    if (bt) for (let i = 0; i < n; i++) addNode(bt.id, (i % cols) * COL_GAP, Math.floor(i / cols) * ROW_GAP);
  }

  /* ---- 2. lateral relations, where the rules allow them ------------------- */

  if (primary && tiers.length > 0) {
    const laterals = bases.filter((r) => r.id !== primary.id);
    const peerBudget = Math.min(MAX_PEER_EDGES, Math.floor(n * 0.05));
    let made = 0;
    laterals.forEach((relation, index) => {
      resetDegrees();
      const pairs: Pair[] = pairsFor(relation.id, blockTypes, rules);
      for (let t = 1; t < tiers.length && made < peerBudget; t++) {
        const row = tiers[t];
        const bt = path[t];
        if (!row || !bt || !pairs.some(([s, target]) => s === bt && target === bt)) continue;
        for (let i = index % 2; i + 1 < row.length && made < peerBudget; i += 2) {
          const a = row[i];
          const b = row[i + 1];
          if (!a || !b) continue;
          if (!withinLimit(a, relation.id, 'out') || !withinLimit(b, relation.id, 'in')) continue;
          link('pe', relation.id, a, b, made < ANIMATED_PEERS);
          made += 1;
        }
      }
    });
  }

  /* ---- 3. scrub: what construction cannot see, `validate` can ------------- */
  // `forbid` (and any rule family added later) judges the whole graph. One
  // validate pass is cheap now; every edge a violation names gets dropped, and
  // one re-check catches violations the first drop uncovered.

  const work: Diagram = {
    id: 'stress',
    name: 'stress',
    nodes,
    edges,
    ruleSetIds: [],
    localRules: [],
    visibility: defaultVisibility(),
    createdAt: '',
    updatedAt: '',
  };
  scrub(work, rules, template);
  scrub(work, rules, template);

  return { nodes, edges: work.edges };
}

/** Drop every edge the rules condemn. Returns whether anything was dropped. */
function scrub(work: Diagram, rules: Rule[], template: DiagramTemplate): boolean {
  const bad = new Set(
    validate(work, rules, template.relations)
      .filter((v) => v.kind === 'edge')
      .map((v) => v.id),
  );
  if (bad.size === 0) return false;
  work.edges = work.edges.filter((e) => !bad.has(e.id));
  return true;
}
