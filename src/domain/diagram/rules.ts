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
import type {
  Diagram,
  DiagramNode,
  Direction,
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

/**
 * Validate a diagram. Returns every violation (node- and edge-level). An empty
 * array means the diagram fully satisfies its effective rules.
 */
export function validate(diagram: Diagram, rules: Rule[]): Violation[] {
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));
  const violations: Violation[] = [];

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
 * Would adding this candidate edge violate a `limit` or edge allow-list rule?
 * Used by the canvas to block illegal links before they are drawn (the demo's
 * "strict mode"). Returns the first blocking message, or null if allowed.
 */
export function edgeWouldViolate(
  diagram: Diagram,
  rules: Rule[],
  candidate: { relationId: string; source: string; target: string },
): string | null {
  const nodesById = new Map(diagram.nodes.map((n) => [n.id, n]));
  const src = nodesById.get(candidate.source);
  const tgt = nodesById.get(candidate.target);
  if (!src || !tgt) return null;

  // Edge allow-list: must satisfy at least one rule if the relation has any.
  const allow = rules.filter(
    (r) =>
      (r.type === 'ends' || r.type === 'chain' || r.type === 'same') &&
      r.relation === candidate.relationId,
  );
  if (allow.length > 0 && !allow.some((r) => edgeSatisfies(r, src, tgt))) {
    return `Loại quan hệ này không được phép nối “${src.label} → ${tgt.label}”.`;
  }

  // Limit: adding the edge must not push either endpoint over a max.
  for (const r of rules) {
    if (r.type !== 'limit' || r.relation !== candidate.relationId) continue;
    const node = r.dir === 'out' ? src : tgt; // 'in'/'any' checked on the gaining side
    if (r.blockType !== '*' && node.blockTypeId !== r.blockType) continue;
    const current = degree(diagram, node.id, r.relation, r.dir);
    if (current + 1 > r.max) {
      return `“${node.label}” đã đạt tối đa ${r.max} ${dirLabel(r.dir)}.`;
    }
  }
  return null;
}
