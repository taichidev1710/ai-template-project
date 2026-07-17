import { describe, it, expect } from 'vitest';
import type { BaseRelation, BlockType, DiagramEdge, DiagramNode } from '@/domain/diagram';
import {
  curveName,
  derivedEdgeDef,
  edgeDef,
  edgeStyleData,
  lineSpec,
  nodeDef,
  resolveAnimated,
  DERIVED_PREFIX,
} from './cy-elements';

const blockType: BlockType = { id: 'bt_person', name: 'Người', shape: 'ellipse', color: '#5fb99a' };

const baseNode: DiagramNode = { id: 'n1', blockTypeId: 'bt_person', label: 'An', pos: { x: 10, y: 20 } };

const relation: BaseRelation = {
  id: 'rel_parent',
  name: 'Cha mẹ – con',
  kind: 'base',
  role: 'primary',
  style: { line: 'dashed', arrow: 'vee', curve: 'bezier', color: '#c46ba0', width: 3 },
};

describe('lineSpec', () => {
  it('maps every domain line style to a cytoscape dash spec', () => {
    expect(lineSpec('solid')).toEqual({ dash: 'solid', pattern: [1], cap: 'butt' });
    expect(lineSpec('dotted')).toEqual({ dash: 'dotted', pattern: [2, 4], cap: 'round' });
    // dashdot/longdash have no native cytoscape line-style — they are `dashed`
    // plus a distinguishing pattern.
    expect(lineSpec('longdash')).toEqual({ dash: 'dashed', pattern: [18, 7], cap: 'butt' });
    expect(lineSpec('dashdot')).toEqual({ dash: 'dashed', pattern: [13, 5, 2, 5], cap: 'round' });
  });
});

describe('curveName', () => {
  it("translates the domain's `bezier` to cytoscape's `unbundled-bezier`", () => {
    expect(curveName('bezier')).toBe('unbundled-bezier');
    expect(curveName('straight')).toBe('straight');
    expect(curveName('taxi')).toBe('taxi');
  });
});

describe('nodeDef', () => {
  it('falls back to the block type shape/colour', () => {
    const def = nodeDef(baseNode, blockType);
    expect(def.data).toMatchObject({ id: 'n1', label: 'An', shape: 'ellipse', color: '#5fb99a' });
    expect(def.position).toEqual({ x: 10, y: 20 });
  });

  it('lets a per-node shape/colour override the block type', () => {
    const def = nodeDef({ ...baseNode, shape: 'star', color: '#ff0000' }, blockType);
    expect(def.data).toMatchObject({ shape: 'star', color: '#ff0000' });
  });

  it('still renders when the block type is missing', () => {
    const def = nodeDef(baseNode, undefined);
    expect(def.data.shape).toBe('ellipse');
    expect(def.data.color).toBeTruthy();
  });

  it('flags exempt nodes so the stylesheet can mark them', () => {
    expect(nodeDef({ ...baseNode, exempt: true }, blockType).data.unk).toBe(true);
    expect(nodeDef(baseNode, blockType).data.unk).toBeUndefined();
  });
});

describe('edgeDef', () => {
  const edge: DiagramEdge = { id: 'e1', relationId: 'rel_parent', source: 'n1', target: 'n2' };

  it("carries the relation's style into data", () => {
    const def = edgeDef(edge, relation);
    expect(def.data).toMatchObject({
      id: 'e1',
      source: 'n1',
      target: 'n2',
      rel: 'rel_parent',
      curve: 'unbundled-bezier',
      line: 'dashed',
      arrow: 'vee',
      color: '#c46ba0',
      width: 3,
    });
  });

  it('falls back to a visible default when the relation is missing', () => {
    const def = edgeDef(edge, undefined);
    expect(def.data.color).toBeTruthy();
    expect(def.data.width).toBeTruthy();
  });
});

describe('resolveAnimated', () => {
  const animatedRel: BaseRelation = { ...relation, style: { ...relation.style, animated: true } };

  it('inherits the relation when the edge says nothing', () => {
    expect(resolveAnimated({}, animatedRel)).toBe(true);
    expect(resolveAnimated({}, relation)).toBe(false);
  });

  it('lets the edge override the relation both ways', () => {
    // An explicit `false` must switch OFF a relation that animates by default —
    // the reason this is `??` and not `||`.
    expect(resolveAnimated({ animated: false }, animatedRel)).toBe(false);
    expect(resolveAnimated({ animated: true }, relation)).toBe(true);
  });

  it('is off when the relation is missing', () => {
    expect(resolveAnimated({}, undefined)).toBe(false);
  });
});

describe('derivedEdgeDef', () => {
  it('is tagged ghostedge and id-prefixed so it can be cleared wholesale', () => {
    const def = derivedEdgeDef('der_grandparent', 'a', 'b', relation.style);
    expect(def.classes).toBe('ghostedge');
    expect(String(def.data.id).startsWith(DERIVED_PREFIX)).toBe(true);
    expect(def.data).toMatchObject({ source: 'a', target: 'b' });
  });

  it('gives each derived pair a distinct id', () => {
    const a = derivedEdgeDef('der_x', 'n1', 'n2', relation.style);
    const b = derivedEdgeDef('der_x', 'n2', 'n1', relation.style);
    expect(a.data.id).not.toBe(b.data.id);
  });

  it('carries the relation name, which is the only label it can ever have', () => {
    // Nobody drew a derived edge, so it has no per-edge label to fall back FROM:
    // without `relName` the stylesheet mapper resolves to '' and every derived
    // link renders anonymous. That was the bug.
    const def = derivedEdgeDef('der_grandparent', 'a', 'b', relation.style, 'Ông bà (suy ra)');
    expect(def.data.relName).toBe('Ông bà (suy ra)');
    expect(def.data.rel).toBe('der_grandparent');
  });
});

describe('edgeStyleData', () => {
  it('flattens a RelationStyle into the fields the stylesheet reads', () => {
    expect(edgeStyleData(relation.style)).toEqual({
      curve: 'unbundled-bezier',
      line: 'dashed',
      arrow: 'vee',
      color: '#c46ba0',
      width: 3,
      animated: false,
    });
  });

  it('passes `line` through so the stylesheet can resolve it by selector', () => {
    // dashdot and longdash both render as cytoscape `dashed`; only the pattern
    // tells them apart, so the raw domain value must survive into the data.
    expect(edgeStyleData({ ...relation.style, line: 'dashdot' }).line).toBe('dashdot');
    expect(edgeStyleData({ ...relation.style, line: 'longdash' }).line).toBe('longdash');
  });
});
