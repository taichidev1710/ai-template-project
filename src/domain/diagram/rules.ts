/**
 * Rule engine — validates a diagram against its effective rules.
 *
 * Two families:
 *   - Node-degree rules (require, limit): count a node's links of a relation in
 *     a direction, compare to min/max.
 *   - Edge allow-list rules (ends, chain, same): for a given relation, an edge
 *     is valid if it satisfies AT LEAST ONE rule of that relation (OR). If a
 *     relation has no allow-list rule, its edges are unconstrained.
 *
 * Pure functions — no framework, fully unit-testable.
 */
import { buildAdjacencyByRelation, patternConnects, type Adjacency } from './derive';
import { isBaseRelation, type Relation } from './types';
import type {
  Diagram,
  DiagramNode,
  Direction,
  ForbidRule,
  RelationStep,
  Rule,
  RuleSet,
  Violation,
} from './types';

/** Effective rules of a diagram = rules from applied rule sets + local rules. */
export function effectiveRules(diagram: Diagram, ruleSets: RuleSet[]): Rule[] {
  const byId = new Map(ruleSets.map((s) => [s.id, s]));
  const out: Rule[] = [];
  for (const id of diagram.ruleSetIds) {
    const set = byId.get(id);
    if (set) out.push(...set.rules);
  }
  return out.concat(diagram.localRules ?? []);
}

/** Count a node's edges of `relation` in a direction. */
function degree(diagram: Diagram, nodeId: string, relation: string, dir: Direction): number {
  let n = 0;
  for (const e of diagram.edges) {
    if (e.relationId !== relation) continue;
    if (dir === 'in' && e.target === nodeId) n++;
    else if (dir === 'out' && e.source === nodeId) n++;
    else if (dir === 'any' && (e.source === nodeId || e.target === nodeId)) n++;
  }
  return n;
}

function dirLabel(dir: Direction): string {
  return dir === 'in' ? 'liên kết đến' : dir === 'out' ? 'liên kết đi' : 'liên kết';
}

/* ---- forbid: the one rule evaluated over the graph, not over block types ---- */

/**
 * Whether the relationship the rule names already links these two, either way
 * round. Both directions, because the rule bans a PAIRING: drawing "vợ chồng"
 * from the sister to the brother must fail exactly as the other way round.
 *
 * A `when` naming nothing in `relations` means the rule was written against
 * another type's catalog, so it matches nothing and stays quiet — same as every
 * other out-of-scope rule (DESIGN §8.4).
 */
function forbidHits(
  rule: ForbidRule,
  diagram: Diagram,
  a: string,
  b: string,
  relations: Relation[],
  byRel: () => Map<string, Adjacency>,
): boolean {
  const bothWays = (pattern: RelationStep[]) => {
    const reach = (from: string, to: string) =>
      patternConnects(diagram.nodes, diagram.edges, from, to, pattern, byRel());
    return reach(a, b) || reach(b, a);
  };

  if (rule.when) {
    const when = relations.find((r) => r.id === rule.when);
    if (!when) return false;
    if (isBaseRelation(when)) {
      return diagram.edges.some(
        (e) =>
          e.relationId === when.id &&
          ((e.source === a && e.target === b) || (e.source === b && e.target === a)),
      );
    }
    return bothWays(when.pattern);
  }
  return rule.pattern?.length ? bothWays(rule.pattern) : false;
}

/** How to say, in a violation message, what these two already are to each other. */
function forbidWhatName(rule: ForbidRule, relations: Relation[]): string {
  if (rule.when) return relations.find((r) => r.id === rule.when)?.name ?? rule.when;
  return (rule.pattern ?? [])
    .map((s) => {
      const arrow = s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : '↔';
      return `${arrow}${relations.find((r) => r.id === s.relationId)?.name ?? s.relationId}`;
    })
    .join(' → ');
}

/** Adjacency for every relation — built once, and only if a forbid rule asks. */
function lazyAdjacency(diagram: Diagram): () => Map<string, Adjacency> {
  let cache: Map<string, Adjacency> | null = null;
  return () => (cache ??= buildAdjacencyByRelation(diagram.nodes, diagram.edges));
}

/**
 * The edge that already carries this exact fact, if any.
 *
 * Not a rule, and deliberately not one: no Loại sơ đồ would ever declare "do not
 * say it twice", and there is no domain where storing one link two times means
 * anything. It is the graph equivalent of a unique key.
 *
 * A `symmetric` relation counts either way round — redrawing "Vợ chồng" back
 * from the wife duplicates the marriage rather than recording a second one. A
 * directed relation does NOT: on a flow chart, Bước 2 → Bước 1 is a loop back to
 * an earlier step, a real edge that the author meant to draw.
 *
 * With `relations` omitted, direction cannot be judged, so only an exact
 * source→target repeat counts — the same quiet fallback `forbid` takes.
 */
function duplicateEdge(
  diagram: Diagram,
  candidate: { relationId: string; source: string; target: string },
  relations: Relation[],
): boolean {
  const rel = relations.find((r) => r.id === candidate.relationId);
  const eitherWay = Boolean(rel && isBaseRelation(rel) && rel.symmetric);
  return diagram.edges.some(
    (e) =>
      e.relationId === candidate.relationId &&
      ((e.source === candidate.source && e.target === candidate.target) ||
        (eitherWay && e.source === candidate.target && e.target === candidate.source)),
  );
}

/**
 * Validate a diagram. Returns every violation (node- and edge-level). An empty
 * array means the diagram fully satisfies its effective rules.
 *
 * `relations` is the Loại sơ đồ's catalog, needed only to resolve what a
 * `forbid` rule's `when` names. Omitting it leaves forbid rules unresolved — and
 * so quiet — exactly as a rule pointing at another type's vocabulary would be.
 */
export function validate(diagram: Diagram, rules: Rule[], relations: Relation[] = []): Violation[] {
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));
  const violations: Violation[] = [];
  const adj = lazyAdjacency(diagram);

  // --- Node-degree rules: require / limit ---
  for (const r of rules) {
    if (r.type !== 'require' && r.type !== 'limit') continue;
    for (const node of diagram.nodes) {
      if (r.blockType !== '*' && node.blockTypeId !== r.blockType) continue;
      if (r.type === 'require' && node.exempt) continue; // exempt nodes skip require
      const c = degree(diagram, node.id, r.relation, r.dir);
      if (r.type === 'require' && c < r.min) {
        violations.push({
          kind: 'node',
          id: node.id,
          ruleId: r.id,
          ruleType: 'require',
          message: `“${node.label}” cần ≥ ${r.min} ${dirLabel(r.dir)} (đang có ${c}).`,
        });
      } else if (r.type === 'limit' && c > r.max) {
        violations.push({
          kind: 'node',
          id: node.id,
          ruleId: r.id,
          ruleType: 'limit',
          message: `“${node.label}” vượt quá ${r.max} ${dirLabel(r.dir)} (đang có ${c}).`,
        });
      }
    }
  }

  // --- Edge allow-list rules: ends / chain / same (grouped per relation, OR) ---
  const allowByRelation = new Map<string, Rule[]>();
  for (const r of rules) {
    if (r.type !== 'ends' && r.type !== 'chain' && r.type !== 'same') continue;
    const list = allowByRelation.get(r.relation) ?? [];
    list.push(r);
    allowByRelation.set(r.relation, list);
  }

  for (const e of diagram.edges) {
    const allow = allowByRelation.get(e.relationId);
    const firstAllow = allow?.[0];
    if (!allow || !firstAllow) continue; // relation is unconstrained
    const src = nodesById.get(e.source);
    const tgt = nodesById.get(e.target);
    if (!src || !tgt) continue;
    const ok = allow.some((r) => edgeSatisfies(r, src, tgt));
    if (!ok) {
      violations.push({
        kind: 'edge',
        id: e.id,
        ruleId: firstAllow.id,
        ruleType: firstAllow.type,
        message: `Liên kết “${src.label} → ${tgt.label}” không thỏa ràng buộc nối của loại quan hệ này.`,
      });
    }
  }

  // --- Edge deny rules: forbid (a veto, applied on top of the allow-list) ---
  for (const r of rules) {
    if (r.type !== 'forbid') continue;
    const whenName = forbidWhatName(r, relations);
    for (const e of diagram.edges) {
      if (e.relationId !== r.relation) continue;
      const src = nodesById.get(e.source);
      const tgt = nodesById.get(e.target);
      if (!src || !tgt) continue;
      if (!forbidHits(r, diagram, e.source, e.target, relations, adj)) continue;
      violations.push({
        kind: 'edge',
        id: e.id,
        ruleId: r.id,
        ruleType: 'forbid',
        message: `“${src.label}” và “${tgt.label}” đã có quan hệ “${whenName}” nên không được nối liên kết này.`,
      });
    }
  }

  return violations;
}

/** Whether a single edge satisfies one allow-list rule. */
function edgeSatisfies(rule: Rule, src: DiagramNode, tgt: DiagramNode): boolean {
  if (rule.type === 'ends') {
    return rule.from.includes(src.blockTypeId) && rule.to.includes(tgt.blockTypeId);
  }
  if (rule.type === 'same') {
    const same = src.blockTypeId === tgt.blockTypeId;
    if (!rule.blockTypes || rule.blockTypes.length === 0) return same;
    return same && rule.blockTypes.includes(src.blockTypeId);
  }
  if (rule.type === 'chain') {
    const i = rule.order.indexOf(src.blockTypeId);
    const j = rule.order.indexOf(tgt.blockTypeId);
    return i >= 0 && j >= 0 && j === i + 1;
  }
  return true;
}

/**
 * Would drawing this edge break a rule — either because the edge itself breaks
 * one, or because it breaks an edge ALREADY on the canvas? Used to block illegal
 * links before they are drawn (the demo's "strict mode"). Returns the first
 * blocking message, or null if allowed.
 *
 * This is the counterpart of `validate`, and the two must agree: anything this
 * lets through, `validate` must accept. Where they disagree the canvas draws a
 * link and the Vi phạm panel condemns it in the same breath.
 *
 * `relations` is the Loại sơ đồ's catalog. It resolves what a `forbid` rule's
 * `when` names and whether a relation is `symmetric`; omit it and both fall
 * quiet, exactly as a rule aimed at another type's vocabulary does.
 */
export function edgeWouldViolate(
  diagram: Diagram,
  rules: Rule[],
  candidate: { relationId: string; source: string; target: string },
  relations: Relation[] = [],
): string | null {
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));
  const src = nodesById.get(candidate.source);
  const tgt = nodesById.get(candidate.target);
  if (!src || !tgt) return null;
  const relName = (id: string) => relations.find((r) => r.id === id)?.name ?? id;

  // Already on the canvas — drawing it again adds nothing.
  if (duplicateEdge(diagram, candidate, relations)) {
    return `“${src.label}” và “${tgt.label}” đã có liên kết “${relName(candidate.relationId)}” rồi.`;
  }

  // Edge allow-list: must satisfy at least one rule if the relation has any.
  const allow = rules.filter(
    (r) =>
      (r.type === 'ends' || r.type === 'chain' || r.type === 'same') &&
      r.relation === candidate.relationId,
  );
  if (allow.length > 0 && !allow.some((r) => edgeSatisfies(r, src, tgt))) {
    return `Loại quan hệ này không được phép nối “${src.label} → ${tgt.label}”.`;
  }

  // Forbid: a veto, so it is checked even when the allow-list above said yes.
  const adj = lazyAdjacency(diagram);
  for (const r of rules) {
    if (r.type !== 'forbid' || r.relation !== candidate.relationId) continue;
    if (forbidHits(r, diagram, candidate.source, candidate.target, relations, adj)) {
      return `“${src.label}” và “${tgt.label}” đã có quan hệ “${forbidWhatName(r, relations)}”.`;
    }
  }

  // Forbid, the other half: the candidate can break a link already drawn. A
  // forbid rule bans a PAIRING, and a pairing is broken just as much by adding
  // the link that MAKES two blocks kin as by adding the banned link itself.
  // Reading only the candidate's own relation left this wide open: the canvas
  // would marry two blocks, let you hand them a shared parent, and `validate`
  // condemned the marriage the instant the parent link landed — the guard and
  // the validator contradicting each other over the same rule.
  const after: Diagram = { ...diagram, edges: [...diagram.edges, { id: '__candidate__', ...candidate }] };
  const afterAdj = lazyAdjacency(after);
  for (const r of rules) {
    if (r.type !== 'forbid') continue;
    for (const e of diagram.edges) {
      if (e.relationId !== r.relation) continue;
      // Already broken without the candidate: someone else's doing. Blocking on
      // it would strand an invalid diagram, unable to be edited back to valid.
      if (forbidHits(r, diagram, e.source, e.target, relations, adj)) continue;
      if (!forbidHits(r, after, e.source, e.target, relations, afterAdj)) continue;
      const a = nodesById.get(e.source)?.label ?? e.source;
      const b = nodesById.get(e.target)?.label ?? e.target;
      return `Nối xong thì “${a}” và “${b}” thành “${forbidWhatName(r, relations)}”, mà hai khối này đã có liên kết “${relName(r.relation)}”.`;
    }
  }

  // Limit: adding the edge must not push either endpoint over a max. Which end
  // gains a link depends on the direction: `out` loads only the source, `in`
  // only the target, and `any` loads BOTH — checking one end there would let a
  // symmetric relation (spouse) exceed its max from the source's side.
  for (const r of rules) {
    if (r.type !== 'limit' || r.relation !== candidate.relationId) continue;
    const gaining = r.dir === 'out' ? [src] : r.dir === 'in' ? [tgt] : [src, tgt];
    for (const node of gaining) {
      if (r.blockType !== '*' && node.blockTypeId !== r.blockType) continue;
      const current = degree(diagram, node.id, r.relation, r.dir);
      if (current + 1 > r.max) {
        return `“${node.label}” đã đạt tối đa ${r.max} ${dirLabel(r.dir)}.`;
      }
    }
  }
  return null;
}
