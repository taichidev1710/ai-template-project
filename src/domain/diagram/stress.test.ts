import { describe, it, expect } from 'vitest';
import { generateStress, MAX_STRESS_BLOCKS } from './stress';
import type { BaseRelation, BlockType, DiagramTemplate } from './types';

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

const template = (over: Partial<DiagramTemplate> = {}): DiagramTemplate => ({
  id: 'tpl',
  name: 'Stress',
  blockTypes: [blockType('bt_a', 'A'), blockType('bt_b', 'B'), blockType('bt_c', 'C')],
  relations: [relation('rel_p', 'primary'), relation('rel_s', 'secondary')],
  ruleSets: [],
  ...over,
});

describe('generateStress', () => {
  it('builds exactly the requested number of blocks', () => {
    const { nodes } = generateStress(template(), 500);
    expect(nodes).toHaveLength(500);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(500);
  });

  it('clamps the request to the supported range', () => {
    expect(generateStress(template(), 0).nodes).toHaveLength(1);
    expect(generateStress(template(), MAX_STRESS_BLOCKS + 5000).nodes).toHaveLength(MAX_STRESS_BLOCKS);
  });

  it('joins every non-root block to a parent over the primary relation', () => {
    const { nodes, edges } = generateStress(template(), 200);
    const tree = edges.filter((e) => e.relationId === 'rel_p');
    expect(tree).toHaveLength(nodes.length - 1);
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it('spreads lateral links over the OTHER base relations', () => {
    const { edges } = generateStress(template(), 1000);
    const lateral = edges.filter((e) => e.relationId === 'rel_s');
    expect(lateral.length).toBeGreaterThan(0);
    expect(lateral.length).toBeLessThanOrEqual(50); // 5% of 1000
  });

  it('cycles block types by tier, so every declared type appears', () => {
    const { nodes } = generateStress(template(), 100);
    const used = new Set(nodes.map((n) => n.blockTypeId));
    expect(used).toEqual(new Set(['bt_a', 'bt_b', 'bt_c']));
  });

  it('is deterministic — same request, same diagram', () => {
    expect(generateStress(template(), 300)).toEqual(generateStress(template(), 300));
  });

  it('lays a grid with no links when the template declares no base relation', () => {
    const { nodes, edges } = generateStress(template({ relations: [] }), 50);
    expect(nodes).toHaveLength(50);
    expect(edges).toHaveLength(0);
  });

  it('returns nothing for a template with no block types — no vocabulary, no data', () => {
    expect(generateStress(template({ blockTypes: [] }), 100)).toEqual({ nodes: [], edges: [] });
  });
});
