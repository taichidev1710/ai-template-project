/**
 * Sample-data generator — fills ANY Loại sơ đồ with rule-valid content.
 *
 * Like the rest of this folder it knows nothing about “Người” or “Công ty”: it
 * reads only the template's own vocabulary (block types + relations) and the
 * rules of the applied rule sets, then builds data those rules accept. A
 * user-authored type is therefore served exactly like a builtin one.
 *
 * Shape of the output:
 *   1. a tree over the PRIMARY relation, laid out tier by tier (one row each);
 *   2. block types that tree never reaches get their own row, attached with the
 *      first relation allowed to carry them;
 *   3. relations still unused pair peers inside a tier — that is what a
 *      `secondary` (lateral) link means;
 *   4. a repair pass adds whatever `require` still asks for.
 *
 * Every edge goes through `edgeWouldViolate` — the SAME guard the canvas uses
 * before drawing — so `limit`/`ends`/`chain`/`same` hold by construction and
 * only `require` (the one rule about MISSING edges) needs the repair pass.
 *
 * Where the rules are silent the generator has to guess: a relation with no
 * ends/chain/same rule may legally join ANY two block types, so the sample is
 * only ever as precise as the type's own rules are.
 */
import { edgeWouldViolate, validate } from './rules';
import {
  defaultVisibility,
  isBaseRelation,
  type BlockType,
  type Diagram,
  type DiagramEdge,
  type DiagramNode,
  type DiagramTemplate,
  type Direction,
  type RequireRule,
  type Rule,
} from './types';

/** Tiers to aim for on the primary tree. Four lets a 3-hop pattern still match. */
const TARGET_DEPTH = 4;
/** Children per parent group. */
const BRANCH = 2;
/** Without a cap, `BRANCH` per tier grows the deepest row past what is useful. */
const MAX_TIER_WIDTH = 4;
const COL_GAP = 170;
const ROW_GAP = 150;

/** An ordered (source, target) block-type pair a relation is allowed to join. */
type Pair = readonly [string, string];

export interface SampleContent {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/** Rules of the applied sets — all of the template's sets when none are named. */
function selectedRules(template: DiagramTemplate, ruleSetIds?: string[]): Rule[] {
  const sets = ruleSetIds
    ? template.ruleSets.filter((rs) => ruleSetIds.includes(rs.id))
    : template.ruleSets;
  return sets.flatMap((rs) => rs.rules);
}

/**
 * Which (source, target) block-type pairs `relationId` may join. ends/chain/same
 * are an OR allow-list, so the pairs are their union; a relation with no
 * allow-list rule is unconstrained and may join anything.
 */
function pairsFor(relationId: string, blockTypes: BlockType[], rules: Rule[]): Pair[] {
  const ids = blockTypes.map((b) => b.id);
  const allow = rules.filter(
    (r) => (r.type === 'ends' || r.type === 'chain' || r.type === 'same') && r.relation === relationId,
  );
  if (allow.length === 0) return ids.flatMap((s) => ids.map((t) => [s, t] as Pair));

  const out = new Map<string, Pair>();
  const add = (s: string, t: string) => {
    if (ids.includes(s) && ids.includes(t)) out.set(`${s}>${t}`, [s, t]);
  };
  for (const r of allow) {
    if (r.type === 'ends') {
      for (const s of r.from) for (const t of r.to) add(s, t);
    } else if (r.type === 'chain') {
      for (let i = 0; i + 1 < r.order.length; i++) {
        const s = r.order[i];
        const t = r.order[i + 1];
        if (s && t) add(s, t);
      }
    } else if (r.type === 'same') {
      for (const b of r.blockTypes?.length ? r.blockTypes : ids) add(b, b);
    }
  }
  return [...out.values()];
}

/** Strongest `require` on this block type — how many links it may not go without. */
function requireMin(bt: string, relation: string, dir: Direction, rules: Rule[]): number {
  let min = 0;
  for (const r of rules) {
    if (r.type !== 'require' || r.relation !== relation || r.dir !== dir) continue;
    if (r.blockType !== '*' && r.blockType !== bt) continue;
    min = Math.max(min, r.min);
  }
  return min;
}

/** Tightest `limit` on this block type. `Infinity` when no rule caps it. */
function limitMax(bt: string, relation: string, dir: Direction, rules: Rule[]): number {
  let max = Infinity;
  for (const r of rules) {
    if (r.type !== 'limit' || r.relation !== relation || r.dir !== dir) continue;
    if (r.blockType !== '*' && r.blockType !== bt) continue;
    max = Math.min(max, r.max);
  }
  return max;
}

/**
 * The tier order the primary tree follows. It starts at a block type nothing
 * requires links INTO — only such a type can sit at the root without failing a
 * `require` — then walks the allowed pairs, preferring an unvisited type so one
 * pass covers as much of the vocabulary as the relation permits. When nothing
 * new is reachable it repeats the current type if that type may link to itself,
 * which is how a single-block-type domain still gets generations.
 */
function tierPath(blockTypes: BlockType[], primaryId: string, rules: Rule[]): string[] {
  const order = blockTypes.map((b) => b.id);
  const pairs = pairsFor(primaryId, blockTypes, rules);
  const targetsOf = (s: string) => pairs.filter(([from]) => from === s).map(([, to]) => to);
  const isRoot = (bt: string) =>
    requireMin(bt, primaryId, 'in', rules) === 0 && requireMin(bt, primaryId, 'any', rules) === 0;

  const start = order.find((bt) => isRoot(bt) && targetsOf(bt).length > 0) ?? order.find(isRoot) ?? order[0];
  if (!start) return [];

  const path = [start];
  while (path.length < TARGET_DEPTH) {
    const cur = path[path.length - 1];
    if (!cur) break;
    const options = targetsOf(cur);
    const unvisited = order.find((bt) => options.includes(bt) && !path.includes(bt));
    const next = unvisited ?? (options.includes(cur) ? cur : order.find((bt) => options.includes(bt)));
    if (!next) break;
    path.push(next);
  }
  return path;
}

/**
 * Build sample nodes + edges for `template`. `ruleSetIds` is the subset of the
 * type's rule sets to satisfy — pass the diagram's own ticks so the sample obeys
 * exactly the rules that diagram runs under.
 */
export function generateSample(template: DiagramTemplate, ruleSetIds?: string[]): SampleContent {
  const { blockTypes } = template;
  const rules = selectedRules(template, ruleSetIds);
  const bases = template.relations.filter(isBaseRelation);
  const primary = bases.find((r) => r.role === 'primary') ?? bases[0];
  if (blockTypes.length === 0 || !primary) return { nodes: [], edges: [] };

  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  /** The engine takes a whole Diagram; this view is the draft built so far. */
  const work: Diagram = {
    id: 'sample',
    name: 'sample',
    nodes,
    edges,
    ruleSetIds: [],
    localRules: [],
    visibility: defaultVisibility(),
    createdAt: '',
    updatedAt: '',
  };

  const pairCache = new Map<string, Pair[]>();
  const pairs = (relationId: string): Pair[] => {
    const hit = pairCache.get(relationId);
    if (hit) return hit;
    const built = pairsFor(relationId, blockTypes, rules);
    pairCache.set(relationId, built);
    return built;
  };

  const counters = new Map<string, number>();
  const addNode = (blockTypeId: string, x: number, y: number): DiagramNode => {
    const n = (counters.get(blockTypeId) ?? 0) + 1;
    counters.set(blockTypeId, n);
    const node: DiagramNode = {
      id: `sn_${nodes.length + 1}`,
      blockTypeId,
      label: `${blockTypes.find((b) => b.id === blockTypeId)?.name ?? 'Khối'} ${n}`,
      pos: { x: Math.round(x), y: Math.round(y) },
    };
    nodes.push(node);
    return node;
  };

  /** Draw an edge only where the canvas would let a user draw one by hand. */
  const link = (relationId: string, source: string, target: string): boolean => {
    if (source === target) return false;
    const dup = edges.some((e) => e.relationId === relationId && e.source === source && e.target === target);
    if (dup) return false;
    // `template.relations` resolves what a forbid rule names — without it the
    // generator would happily draw links the canvas refuses.
    if (edgeWouldViolate(work, rules, { relationId, source, target }, template.relations)) return false;
    edges.push({ id: `se_${edges.length + 1}`, relationId, source, target });
    return true;
  };

  const degreeOf = (nodeId: string, relation: string, dir: Direction): number =>
    edges.filter((e) => {
      if (e.relationId !== relation) return false;
      if (dir === 'in') return e.target === nodeId;
      if (dir === 'out') return e.source === nodeId;
      return e.source === nodeId || e.target === nodeId;
    }).length;

  /* ---- 1. the primary tree, tier by tier ---------------------------------- */

  const path = tierPath(blockTypes, primary.id, rules);
  const tiers: DiagramNode[][] = [];

  /** Parents each node of tier `t` takes: what `require` asks for, capped by `limit`. */
  const parentsPerNode = (t: number): number => {
    const bt = path[t];
    if (!bt || t === 0) return 0;
    const need = Math.max(requireMin(bt, primary.id, 'in', rules), 1);
    const cap = Math.min(
      limitMax(bt, primary.id, 'in', rules),
      limitMax(bt, primary.id, 'any', rules),
    );
    return Math.max(1, Math.min(need, cap));
  };

  /**
   * Parent groups tier `t` offers its children: consecutive chunks of the size
   * the next tier needs. Chunking consecutively is what makes co-parents a
   * couple — the lateral pass below pairs the very same consecutive nodes.
   */
  const groupsOf = (t: number): number => {
    const row = tiers[t];
    if (!row) return 1;
    return Math.max(1, Math.floor(row.length / Math.max(1, parentsPerNode(t + 1))));
  };

  for (let t = 0; t < path.length; t++) {
    const bt = path[t];
    if (!bt) break;

    let width: number;
    if (t === 0) {
      // The root row exists to parent tier 1. When children take more than one
      // parent, give tier 1 a group EACH: sharing groups would make its nodes
      // siblings, and — worse — make tier 2 first cousins, which a `forbid` rule
      // then refuses to pair. Tier 1 is capped at MAX_TIER_WIDTH, so that many
      // groups is one per node. A single-parent domain (an org chart) wants the
      // opposite: one root everything hangs off.
      const k = parentsPerNode(1);
      width = k === 0 ? MAX_TIER_WIDTH : (k >= 2 ? MAX_TIER_WIDTH : 1) * k;
    } else {
      width = Math.min(groupsOf(t - 1) * BRANCH, MAX_TIER_WIDTH);
    }

    const row: DiagramNode[] = [];
    for (let i = 0; i < width; i++) {
      row.push(addNode(bt, (i - (width - 1) / 2) * COL_GAP, t * ROW_GAP));
    }
    tiers.push(row);

    const prev = tiers[t - 1];
    if (t > 0 && prev) {
      const k = parentsPerNode(t);
      const groupCount = Math.max(1, Math.floor(prev.length / k));
      row.forEach((child, i) => {
        // Round-robin so NEIGHBOURING nodes draw from different groups: that
        // keeps consecutive nodes unrelated, which the lateral pass relies on.
        for (const parent of prev.slice((i % groupCount) * k, (i % groupCount) * k + k)) {
          link(primary.id, parent.id, child.id);
        }
      });
    }
  }

  /* ---- 2. block types the tree never reached ------------------------------ */

  const onPath = new Set(path);
  const usedRelations = new Set<string>([primary.id]);
  let extraRow = path.length;

  /** Where a block type sits on the primary path (-1 when it is off it). */
  const tierOf = (bt: string) => path.indexOf(bt);

  for (const bt of blockTypes) {
    if (onPath.has(bt.id)) continue;

    // Take the first free relation the rules ALLOW to carry this type onto the
    // tree, and the first endpoint they allow — nothing more.
    //
    // This used to read a `limit(x, R, 'in')` as the author "meaning" x to be the
    // target, and to rank candidate tiers by depth and novelty. That was inferring
    // rules nobody wrote: with a real `ends` rule there is exactly one candidate
    // and the guesswork was never needed; without one, the type genuinely has not
    // said, and picking a favourite would only dress a coin-flip up as intent.
    const attachment = bases
      .filter((r) => !usedRelations.has(r.id))
      .map((relation) => {
        const target = pairs(relation.id).find(([s, t]) => s === bt.id && onPath.has(t));
        return target ? { relation, targetBt: target[1] } : null;
      })
      .find((a) => a !== null);

    const targets = attachment ? (tiers[tierOf(attachment.targetBt)] ?? []) : [];
    const count = attachment ? Math.min(targets.length, MAX_TIER_WIDTH) : BRANCH;
    for (let i = 0; i < count; i++) {
      const anchor = targets[i];
      const node = addNode(
        bt.id,
        anchor ? anchor.pos.x : (i - (count - 1) / 2) * COL_GAP,
        extraRow * ROW_GAP,
      );
      if (attachment && anchor) link(attachment.relation.id, node.id, anchor.id);
    }
    if (attachment) usedRelations.add(attachment.relation.id);
    extraRow++;
  }

  /* ---- 3. lateral relations: pair peers inside a tier --------------------- */

  bases
    .filter((r) => !usedRelations.has(r.id))
    .forEach((relation, index) => {
      const selfPairs = pairs(relation.id);
      // Tier 0 is the structural root (the company, the unknown ancestors); a
      // lateral link between roots says little, so peers start at tier 1.
      for (let t = 1; t < tiers.length; t++) {
        const row = tiers[t];
        const bt = path[t];
        if (!row || !bt || !selfPairs.some(([s, target]) => s === bt && target === bt)) continue;
        // Offset per relation so a second lateral relation does not simply
        // retrace the pairs the first one already drew.
        for (let i = index % 2; i + 1 < row.length; i += 2) {
          const a = row[i];
          const b = row[i + 1];
          if (a && b) link(relation.id, a.id, b.id);
        }
      }
    });

  /* ---- 4. coverage: a relation with no edge cannot be exercised ----------- */

  /** Join the first pair of nodes this relation is allowed to hold together. */
  const forceOneEdge = (relationId: string): void => {
    for (const [s, t] of pairs(relationId)) {
      for (const a of nodes) {
        if (a.blockTypeId !== s) continue;
        for (const b of nodes) {
          if (b.blockTypeId === t && link(relationId, a.id, b.id)) return;
        }
      }
    }
  };
  for (const relation of bases) {
    if (!edges.some((e) => e.relationId === relation.id)) forceOneEdge(relation.id);
  }

  /* ---- 5. repair: `require` is about MISSING edges, so build cannot ensure it */

  const fillRequire = (rule: RequireRule, node: DiagramNode): boolean => {
    let need = rule.min - degreeOf(node.id, rule.relation, rule.dir);
    if (need <= 0) return false;

    // `in` wants links arriving, so the partner is the source; otherwise it is
    // the target and this node is the source.
    const partnerIsSource = rule.dir === 'in';
    const partnerBts = pairs(rule.relation)
      .filter(([s, t]) => (partnerIsSource ? t === node.blockTypeId : s === node.blockTypeId))
      .map(([s, t]) => (partnerIsSource ? s : t));
    const join = (partnerId: string) =>
      partnerIsSource ? link(rule.relation, partnerId, node.id) : link(rule.relation, node.id, partnerId);

    let changed = false;
    for (const other of nodes) {
      if (need <= 0) break;
      if (other.id === node.id || !partnerBts.includes(other.blockTypeId)) continue;
      if (join(other.id)) {
        need--;
        changed = true;
      }
    }
    // Nothing spare to link to — add a partner, of a type that will not turn
    // round and demand one itself.
    while (need > 0) {
      const fillerBt = partnerBts.find((b) => requireMin(b, rule.relation, rule.dir, rules) === 0);
      if (!fillerBt) break;
      const filler = addNode(fillerBt, node.pos.x + need * COL_GAP, node.pos.y - ROW_GAP);
      if (!join(filler.id)) {
        nodes.pop();
        break;
      }
      need--;
      changed = true;
    }
    return changed;
  };

  for (let round = 0; round < 4; round++) {
    const pending = validate(work, rules, template.relations).filter((v) => v.ruleType === 'require');
    if (pending.length === 0) break;
    let progressed = false;
    for (const v of pending) {
      const rule = rules.find((r) => r.id === v.ruleId);
      const node = nodes.find((n) => n.id === v.id);
      if (!rule || rule.type !== 'require' || !node) continue;
      if (fillRequire(rule, node)) progressed = true;
    }
    // No move left: the rules contradict each other. Stop rather than spin — the
    // leftovers show up in the editor's Vi phạm panel, which is the honest answer.
    if (!progressed) break;
  }

  return { nodes, edges };
}
