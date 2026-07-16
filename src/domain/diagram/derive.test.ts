import { describe, it, expect } from 'vitest';
import { buildAdjacency, computeDerivedPairs, computeRanks } from './derive';
import type { Diagram, DiagramEdge, DiagramNode, DerivedRelation, PathStep, DerivedExclusion } from './types';
import { defaultVisibility } from './types';

/**
 * Family fixture (source = parent, target = child):
 *
 *        A                A -> B,  A -> B2
 *       / \               B -> C,  B2 -> C2
 *      B   B2             C -> D
 *      |    |
 *      C    C2   (C, C2 are cousins)
 *      |
 *      D
 */
const node = (id: string): DiagramNode => ({ id, blockTypeId: 'bt_person', label: id, pos: { x: 0, y: 0 } });
const edge = (source: string, target: string): DiagramEdge => ({
  id: `${source}-${target}`, relationId: 'rel_parent', source, target,
});

function familyDiagram(): Diagram {
  return {
    id: 'd1', name: 'fam',
    nodes: ['A', 'B', 'B2', 'C', 'C2', 'D'].map(node),
    edges: [edge('A', 'B'), edge('A', 'B2'), edge('B', 'C'), edge('B2', 'C2'), edge('C', 'D')],
    ruleSetIds: [], localRules: [], visibility: defaultVisibility(),
    createdAt: '', updatedAt: '',
  };
}

const derived = (pattern: PathStep[], exclude?: DerivedExclusion[]): DerivedRelation => ({
  id: 'der', name: 'x', kind: 'derived', overRelationId: 'rel_parent', pattern, exclude,
  style: { line: 'dotted', arrow: 'none', curve: 'bezier', color: '#000', width: 1 },
});

/** Normalize pairs to a comparable "src>tgt" set. */
const asSet = (pairs: { source: string; target: string }[]) =>
  new Set(pairs.map((p) => `${p.source}>${p.target}`));

describe('computeDerivedPairs — the kị→ông case and friends', () => {
  const d = familyDiagram();

  it('grandparent = [up, up]', () => {
    const pairs = asSet(computeDerivedPairs(d, derived(['up', 'up'])));
    expect(pairs).toEqual(new Set(['C>A', 'C2>A', 'D>B']));
  });

  it('grandchild = [down, down] is the reverse of grandparent', () => {
    const pairs = asSet(computeDerivedPairs(d, derived(['down', 'down'])));
    expect(pairs).toEqual(new Set(['A>C', 'A>C2', 'B>D']));
  });

  it('sibling = [up, down] excluding self', () => {
    const pairs = asSet(computeDerivedPairs(d, derived(['up', 'down'], ['self'])));
    expect(pairs).toEqual(new Set(['B>B2', 'B2>B']));
  });

  it('uncle/aunt = [up, up, down] excluding self and parents', () => {
    const pairs = asSet(computeDerivedPairs(d, derived(['up', 'up', 'down'], ['self', 'parents'])));
    // C's uncle is B2 (its parent B's sibling); C2's uncle is B. D has none (B has only child C).
    expect(pairs).toEqual(new Set(['C>B2', 'C2>B']));
  });

  it('great-grandparent = [up, up, up] spans three generations', () => {
    const pairs = asSet(computeDerivedPairs(d, derived(['up', 'up', 'up'])));
    expect(pairs).toEqual(new Set(['D>A'])); // D -> C -> B -> A
  });

  it('never emits a self pair even without explicit exclude', () => {
    const pairs = computeDerivedPairs(d, derived(['up', 'down']));
    expect(pairs.every((p) => p.source !== p.target)).toBe(true);
  });
});

describe('computeRanks — emergent generation depth', () => {
  it('assigns depth along the primary relation (roots = 0)', () => {
    const d = familyDiagram();
    const adj = buildAdjacency(d.nodes, d.edges, 'rel_parent');
    const rank = computeRanks(adj);
    expect(rank.get('A')).toBe(0);
    expect(rank.get('B')).toBe(1);
    expect(rank.get('B2')).toBe(1);
    expect(rank.get('C')).toBe(2);
    expect(rank.get('C2')).toBe(2);
    expect(rank.get('D')).toBe(3);
  });
});
