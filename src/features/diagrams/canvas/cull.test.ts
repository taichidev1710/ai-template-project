import { describe, it, expect } from 'vitest';
import { visibleWindow, type CullEdge, type CullInput, type CullNode } from './cull';

const node = (id: string, x: number, y: number): CullNode => ({ id, x, y });
const edge = (id: string, source: string, target: string): CullEdge => ({ id, source, target });

/** A 100×100 window at the origin, no padding, roomy cap — override per test. */
const input = (over: Partial<CullInput>): CullInput => ({
  nodes: [],
  edges: [],
  extent: { x1: 0, y1: 0, x2: 100, y2: 100 },
  margin: 0,
  cap: 100,
  ...over,
});

describe('visibleWindow', () => {
  it('keeps nodes inside the extent and drops the rest', () => {
    const { nodeIds } = visibleWindow(
      input({ nodes: [node('in', 50, 50), node('edge-of', 100, 100), node('out', 101, 50)] }),
    );
    expect(nodeIds).toEqual(new Set(['in', 'edge-of']));
  });

  it('margin widens the window so near-offscreen nodes stay mounted', () => {
    const nodes = [node('ring', -30, 50), node('far', -40, 50)];
    // 0.35 of a 100-wide extent pads 35 units each side: -30 is in, -40 is not.
    const { nodeIds } = visibleWindow(input({ nodes, margin: 0.35 }));
    expect(nodeIds).toEqual(new Set(['ring']));
    // Without the margin both are offscreen.
    expect(visibleWindow(input({ nodes })).nodeIds.size).toBe(0);
  });

  it('caps to the nodes nearest the viewport centre', () => {
    const { nodeIds } = visibleWindow(
      input({
        nodes: [node('centre', 50, 50), node('near', 60, 50), node('far', 90, 90)],
        cap: 2,
      }),
    );
    expect(nodeIds).toEqual(new Set(['centre', 'near']));
  });

  it('does not trim when the window holds exactly cap nodes', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => node(`n${i}`, 10 + i * 10, 50));
    expect(visibleWindow(input({ nodes, cap: 5 })).nodeIds.size).toBe(5);
  });

  it('breaks distance ties by id, so identical frames render identically', () => {
    // Equidistant from the centre; only ids differ.
    const nodes = [node('b', 60, 50), node('a', 40, 50)];
    const pick = () => visibleWindow(input({ nodes, cap: 1 })).nodeIds;
    expect(pick()).toEqual(new Set(['a']));
    expect(pick()).toEqual(pick());
  });

  it('keeps an edge only when BOTH endpoints are kept', () => {
    const { edgeIds } = visibleWindow(
      input({
        nodes: [node('a', 10, 10), node('b', 90, 90), node('c', 200, 200)],
        edges: [edge('e-in', 'a', 'b'), edge('e-cut', 'a', 'c')],
      }),
    );
    expect(edgeIds).toEqual(new Set(['e-in']));
  });

  it('drops edges whose endpoint the cap trimmed away', () => {
    const { nodeIds, edgeIds } = visibleWindow(
      input({
        nodes: [node('centre', 50, 50), node('far', 95, 95)],
        edges: [edge('e', 'centre', 'far')],
        cap: 1,
      }),
    );
    expect(nodeIds).toEqual(new Set(['centre']));
    expect(edgeIds.size).toBe(0);
  });
});
