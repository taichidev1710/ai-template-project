import { describe, it, expect } from 'vitest';
import { generateStress, MAX_STRESS_BLOCKS } from './stress';
import { validate } from './rules';
import { defaultVisibility, type BaseRelation, type BlockType, type Diagram, type DiagramTemplate, type Rule } from './types';

const blockType = (id: string, name: string): BlockType => ({
  id,
  name,
  shape: 'ellipse',
  color: '#7d8cc4',
});

const relation = (id: string, role: 'primary' | 'secondary'): BaseRelation => ({
  id,
  name: id,
  kind: 'base',
  role,
  style: { curve: 'straight', line: 'solid', arrow: 'triangle', color: '#5b647e', width: 2 },
});

/** An org-like vocabulary: a strict chain, one parent each, lateral peers. */
const orgRules: Rule[] = [
  { id: 'r_chain', type: 'chain', relation: 'rel_p', order: ['bt_a', 'bt_b', 'bt_c'] },
  { id: 'r_one_parent', type: 'limit', blockType: '*', relation: 'rel_p', dir: 'in', max: 1 },
  { id: 'r_peer_same', type: 'same', relation: 'rel_s', blockTypes: ['bt_c'] },
];

const template = (over: Partial<DiagramTemplate> = {}): DiagramTemplate => ({
  id: 'tpl',
  name: 'Stress',
  blockTypes: [blockType('bt_a', 'Công ty'), blockType('bt_b', 'Phòng ban'), blockType('bt_c', 'Nhân viên')],
  relations: [relation('rel_p', 'primary'), relation('rel_s', 'secondary')],
  ruleSets: [{ id: 'rs1', name: 'Luật', rules: orgRules }],
  ...over,
});

const asDiagram = (content: { nodes: Diagram['nodes']; edges: Diagram['edges'] }): Diagram => ({
  id: 'd',
  name: 'd',
  templateId: 'tpl',
  ...content,
  ruleSetIds: [],
  localRules: [],
  visibility: defaultVisibility(),
  createdAt: '',
  updatedAt: '',
});

describe('generateStress', () => {
  it('builds exactly the requested number of blocks, ids unique', () => {
    const { nodes } = generateStress(template(), ['rs1'], 500);
    expect(nodes).toHaveLength(500);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(500);
  });

  it('clamps the request to the supported range', () => {
    expect(generateStress(template(), ['rs1'], 0).nodes).toHaveLength(1);
    expect(generateStress(template(), ['rs1'], MAX_STRESS_BLOCKS + 5000).nodes).toHaveLength(MAX_STRESS_BLOCKS);
  });

  it('OBEYS the applied rules — the whole point: zero violations at any size', () => {
    for (const size of [50, 500, 3000]) {
      const content = generateStress(template(), ['rs1'], size);
      const violations = validate(asDiagram(content), orgRules, template().relations);
      expect(violations).toEqual([]);
    }
  });

  it('grows a tree: with one-parent rules every non-root has exactly one parent', () => {
    const { nodes, edges } = generateStress(template(), ['rs1'], 400);
    const tree = edges.filter((e) => e.relationId === 'rel_p');
    // One root (the chain starts at bt_a, tier width 1) — everyone else hangs off it.
    expect(tree).toHaveLength(nodes.length - 1);
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it('draws lateral links only where the rules allow them', () => {
    const { nodes, edges } = generateStress(template(), ['rs1'], 1000);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const lateral = edges.filter((e) => e.relationId === 'rel_s');
    expect(lateral.length).toBeGreaterThan(0);
    for (const e of lateral) {
      // The `same` rule names bt_c only.
      expect(byId.get(e.source)?.blockTypeId).toBe('bt_c');
      expect(byId.get(e.target)?.blockTypeId).toBe('bt_c');
    }
  });

  it('animates a sprinkle of lateral edges, so the ants loop gets exercised', () => {
    const { edges } = generateStress(template(), ['rs1'], 1000);
    expect(edges.some((e) => e.animated)).toBe(true);
  });

  it('is deterministic — same request, same diagram', () => {
    expect(generateStress(template(), ['rs1'], 300)).toEqual(generateStress(template(), ['rs1'], 300));
  });

  it('with no rules ticked it still builds a connected tree over the primary', () => {
    const content = generateStress(template({ ruleSets: [] }), undefined, 200);
    expect(content.nodes).toHaveLength(200);
    expect(content.edges.filter((e) => e.relationId === 'rel_p').length).toBeGreaterThan(0);
    expect(validate(asDiagram(content), [], template().relations)).toEqual([]);
  });

  it('lays a grid with no links when the template declares no base relation', () => {
    const { nodes, edges } = generateStress(template({ relations: [] }), undefined, 50);
    expect(nodes).toHaveLength(50);
    expect(edges).toHaveLength(0);
  });

  it('returns nothing for a template with no block types — no vocabulary, no data', () => {
    expect(generateStress(template({ blockTypes: [] }), undefined, 100)).toEqual({ nodes: [], edges: [] });
  });
});
