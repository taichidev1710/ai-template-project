/**
 * Derived-relation engine — computes relations that are NEVER stored.
 *
 * A derived relation is a `pattern` of hops; each hop names a base relation and
 * a direction. Because each step carries its own relation, patterns can MIX
 * relations, which is what makes in-law relations expressible:
 *
 *   grandparent      [↑ parent-child, ↑ parent-child]
 *   grandchild       [↓ parent-child, ↓ parent-child]
 *   sibling          [↑ parent-child, ↓ parent-child]         exclude: self
 *   uncle/aunt       [↑, ↑, ↓ parent-child]                   exclude: self, parents
 *   daughter/son-in-law  [↓ parent-child, ↔ spouse]           exclude: self
 *   parent-in-law    [↔ spouse, ↑ parent-child]
 *
 * `↔` (both) follows a symmetric relation (spouse) in either direction.
 */
import type { DerivedRelation, Diagram, DiagramEdge, DiagramNode, RelationStep } from './types';

/** Parent/child adjacency for ONE relation (source = parent, target = child). */
export interface Adjacency {
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
}

export function buildAdjacency(nodes: DiagramNode[], edges: DiagramEdge[], relationId: string): Adjacency {
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    parents.set(n.id, []);
    children.set(n.id, []);
  }
  for (const e of edges) {
    if (e.relationId !== relationId) continue;
    if (!children.has(e.source) || !parents.has(e.target)) continue;
    children.get(e.source)!.push(e.target);
    parents.get(e.target)!.push(e.source);
  }
  return { parents, children };
}

/** Adjacency for every relation present in the diagram, keyed by relation id. */
export function buildAdjacencyByRelation(nodes: DiagramNode[], edges: DiagramEdge[]): Map<string, Adjacency> {
  const byRel = new Map<string, Adjacency>();
  const ensure = (relationId: string): Adjacency => {
    let adj = byRel.get(relationId);
    if (!adj) {
      adj = { parents: new Map(), children: new Map() };
      for (const n of nodes) {
        adj.parents.set(n.id, []);
        adj.children.set(n.id, []);
      }
      byRel.set(relationId, adj);
    }
    return adj;
  };
  for (const e of edges) {
    const adj = ensure(e.relationId);
    if (!adj.children.has(e.source) || !adj.parents.has(e.target)) continue;
    adj.children.get(e.source)!.push(e.target);
    adj.parents.get(e.target)!.push(e.source);
  }
  return byRel;
}

/** Neighbors of `id` for one hop (relation + direction). */
function neighbors(id: string, step: RelationStep, byRel: Map<string, Adjacency>): string[] {
  const adj = byRel.get(step.relationId);
  if (!adj) return [];
  const out: string[] = [];
  if (step.dir === 'up' || step.dir === 'both') out.push(...(adj.parents.get(id) ?? []));
  if (step.dir === 'down' || step.dir === 'both') out.push(...(adj.children.get(id) ?? []));
  return out;
}

/** Walk the full pattern from a single starting node; returns the reachable set. */
function walk(startId: string, pattern: RelationStep[], byRel: Map<string, Adjacency>): Set<string> {
  let frontier = new Set<string>([startId]);
  for (const step of pattern) {
    const next = new Set<string>();
    for (const id of frontier) for (const nb of neighbors(id, step, byRel)) next.add(nb);
    frontier = next;
  }
  return frontier;
}

/**
 * Whether walking `pattern` from `fromId` arrives at `toId` — "is B my sister?"
 * asked of the same engine that draws derived relations. The `forbid` rule is
 * built on this, which is why a forbid rule and a derived relation speak the
 * one vocabulary: if you can DRAW a relationship, you can BAN marrying it.
 */
export function patternConnects(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  fromId: string,
  toId: string,
  pattern: RelationStep[],
  byRel?: Map<string, Adjacency>,
): boolean {
  if (pattern.length === 0) return false;
  const adjByRel = byRel ?? buildAdjacencyByRelation(nodes, edges);
  return walk(fromId, pattern, adjByRel).has(toId);
}

/** Siblings of `id` over one relation (shared parent), for the `siblings` exclusion. */
function siblingsOf(id: string, adj: Adjacency): Set<string> {
  const out = new Set<string>();
  for (const p of adj.parents.get(id) ?? []) {
    for (const c of adj.children.get(p) ?? []) if (c !== id) out.add(c);
  }
  return out;
}

export interface DerivedPair {
  relationId: string;
  source: string;
  target: string;
}

/**
 * Every ordered node-pair (source, target) reachable by the derived relation's
 * pattern, after exclusions. Exclusions (parents/children/siblings) are taken
 * relative to the FIRST hop's relation — the anchor of the path.
 */
export function computeDerivedPairs(
  diagram: Diagram,
  derived: DerivedRelation,
  byRel?: Map<string, Adjacency>,
): DerivedPair[] {
  const adjByRel = byRel ?? buildAdjacencyByRelation(diagram.nodes, diagram.edges);
  const exclude = new Set(derived.exclude ?? []);
  const anchorRelId = derived.pattern[0]?.relationId;
  const anchor = anchorRelId ? adjByRel.get(anchorRelId) : undefined;
  const pairs: DerivedPair[] = [];
  const seen = new Set<string>();

  for (const node of diagram.nodes) {
    const reached = walk(node.id, derived.pattern, adjByRel);

    reached.delete(node.id); // never self
    if (anchor) {
      if (exclude.has('parents')) for (const p of anchor.parents.get(node.id) ?? []) reached.delete(p);
      if (exclude.has('children')) for (const c of anchor.children.get(node.id) ?? []) reached.delete(c);
      if (exclude.has('siblings')) for (const s of siblingsOf(node.id, anchor)) reached.delete(s);
    }

    for (const target of reached) {
      const key = `${node.id} ${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ relationId: derived.id, source: node.id, target });
    }
  }
  return pairs;
}

/** Emergent rank: depth of each node along the primary relation (roots = 0). */
export function computeRanks(adj: Adjacency): Map<string, number> {
  const rank = new Map<string, number>();
  const visiting = new Set<string>();

  const depth = (id: string): number => {
    const cached = rank.get(id);
    if (cached != null) return cached;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const parents = adj.parents.get(id) ?? [];
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map(depth));
    visiting.delete(id);
    rank.set(id, d);
    return d;
  };

  for (const id of adj.parents.keys()) depth(id);
  return rank;
}
