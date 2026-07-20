import { describe, it, expect } from 'vitest';
import { visibleWindow, type CullEdge, type CullInput, type CullNode } from './cull';

const node = (id: string, x: number, y: number): CullNode => ({ id, x, y });
const edge = (id: string, source: string, target: string): CullEdge => ({ id, source, target });

/** A 100×100 window at the origin, no padding, roomy caps — override per test. */
const input = (over: Partial<CullInput>): CullInput => ({
  nodes: [],
  edges: [],
  extent: { x1: 0, y1: 0, x2: 100, y2: 100 },
  margin: 0,
  cap: 100,
  extraCap: 100,
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

  it('overview mode spreads the cap across the WHOLE window, corners included', () => {
    // A uniform 20×20 grid filling the window — 400 nodes against a cap of 100.
    const nodes: CullNode[] = [];
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) nodes.push(node(`n${i}-${j}`, i * 5 + 2.5, j * 5 + 2.5));
    }
    const { nodeIds, capped, farCut } = visibleWindow(input({ nodes, cap: 100 }));
    expect(capped).toBe(true);
    expect(nodeIds.size).toBeLessThanOrEqual(100);
    expect(nodeIds.size).toBeGreaterThanOrEqual(80); // the budget is actually spent
    // Every corner zone holds something — no blob in the middle of the frame.
    const kept = nodes.filter((n) => nodeIds.has(n.id));
    for (const [right, bottom] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      expect(kept.some((n) => (right ? n.x > 75 : n.x < 25) && (bottom ? n.y > 75 : n.y < 25))).toBe(true);
    }
    // Overview counts no ⇢N — the statline already says the view is trimmed.
    expect(farCut.size).toBe(0);
  });

  it('does not trim — nor report capped — when the window holds exactly cap nodes', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => node(`n${i}`, 10 + i * 10, 50));
    const result = visibleWindow(input({ nodes, cap: 5 }));
    expect(result.nodeIds.size).toBe(5);
    expect(result.capped).toBe(false);
  });

  it('breaks distance ties by id, so identical frames render identically', () => {
    // Equidistant from the centre; only ids differ.
    const nodes = [node('b', 60, 50), node('a', 40, 50)];
    const pick = () => visibleWindow(input({ nodes, cap: 1 })).nodeIds;
    expect(pick()).toEqual(new Set(['a']));
    expect(pick()).toEqual(pick());
  });

  it('mounts the FAR endpoint of an edge leaving the window, so the link draws', () => {
    const { nodeIds, edgeIds, farCut } = visibleWindow(
      input({
        nodes: [node('a', 50, 50), node('faraway', 900, 900)],
        edges: [edge('e', 'a', 'faraway')],
      }),
    );
    expect(nodeIds).toEqual(new Set(['a', 'faraway']));
    expect(edgeIds).toEqual(new Set(['e']));
    expect(farCut.size).toBe(0);
  });

  it('bounds far endpoints by extraCap and counts what stayed undrawn (⇢N)', () => {
    const { nodeIds, edgeIds, farCut } = visibleWindow(
      input({
        nodes: [node('hub', 50, 50), node('p1', 500, 50), node('p2', 900, 50), node('p3', 1300, 50)],
        edges: [edge('e1', 'hub', 'p1'), edge('e2', 'hub', 'p2'), edge('e3', 'hub', 'p3')],
        extraCap: 2,
      }),
    );
    // The two NEAREST partners come in; the third link stays cut and is counted.
    expect(nodeIds).toEqual(new Set(['hub', 'p1', 'p2']));
    expect(edgeIds).toEqual(new Set(['e1', 'e2']));
    expect(farCut.get('hub')).toBe(1);
  });

  it('with extraCap 0 behaves like the demo: edge needs both ends in the window', () => {
    const { nodeIds, edgeIds, farCut } = visibleWindow(
      input({
        nodes: [node('a', 10, 10), node('b', 90, 90), node('c', 200, 200)],
        edges: [edge('e-in', 'a', 'b'), edge('e-cut', 'a', 'c')],
        extraCap: 0,
      }),
    );
    expect(nodeIds).toEqual(new Set(['a', 'b']));
    expect(edgeIds).toEqual(new Set(['e-in']));
    expect(farCut.get('a')).toBe(1);
  });

  it('does NOT resurrect a cap-trimmed partner as a far endpoint', () => {
    const { nodeIds, edgeIds, farCut } = visibleWindow(
      input({
        nodes: [node('centre', 50, 50), node('far', 95, 95)],
        edges: [edge('e', 'centre', 'far')],
        cap: 1,
      }),
    );
    // `far` lost to the cap while INSIDE the window — bringing it back through
    // the far-endpoint door would undo the cap one edge at a time. And in
    // overview mode nothing counts ⇢N: the whole frame is declared trimmed.
    expect(nodeIds).toEqual(new Set(['centre']));
    expect(edgeIds.size).toBe(0);
    expect(farCut.size).toBe(0);
  });
});
