/**
 * Viewport culling — pick the elements worth mounting for the current view.
 *
 * Cytoscape draws every element it holds each frame, so a diagram of thousands
 * of nodes stays slow even when only a corner is on screen. The demo (demo-sdqh)
 * answered this with `refreshWindow`: mount only what falls in the viewport, plus
 * a cap. This is that decision, pulled out as a pure function so it can be tested
 * without a `cy` instance or a browser.
 *
 * It is intentionally geometry-only: it knows nothing of block types, relations,
 * or rules. Give it positions and an extent, it returns which ids to show.
 */

export interface Extent {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CullNode {
  id: string;
  x: number;
  y: number;
}

export interface CullEdge {
  id: string;
  source: string;
  target: string;
}

export interface CullInput {
  nodes: CullNode[];
  edges: CullEdge[];
  /** Viewport in model coordinates. */
  extent: Extent;
  /**
   * Fraction of the extent's width/height to pad on each side. A margin renders
   * a ring of off-screen nodes so a pan reveals them already drawn instead of
   * flashing in. `0.5` = grow the window by 50% each way.
   */
  margin: number;
  /**
   * Hard cap on mounted NODES. When more than this fall in the window — a graph
   * zoomed far out — the ones nearest the viewport centre win, so what renders is
   * a bounded slice around where the user is looking rather than everything.
   */
  cap: number;
}

export interface CullResult {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

/**
 * Which nodes and edges to mount for `extent`. An edge is kept only when BOTH
 * its endpoints are kept — cytoscape rejects an edge whose node is absent.
 */
export function visibleWindow({ nodes, edges, extent, margin, cap }: CullInput): CullResult {
  const dx = (extent.x2 - extent.x1) * margin;
  const dy = (extent.y2 - extent.y1) * margin;
  const x1 = extent.x1 - dx;
  const x2 = extent.x2 + dx;
  const y1 = extent.y1 - dy;
  const y2 = extent.y2 + dy;

  const inWindow = nodes.filter((n) => n.x >= x1 && n.x <= x2 && n.y >= y1 && n.y <= y2);

  let kept = inWindow;
  if (inWindow.length > cap) {
    // Too many in view: keep the `cap` nearest the viewport centre. Sorting by
    // distance then id makes the trimmed slice deterministic (tests, and a stable
    // picture across identical frames).
    const cx = (extent.x1 + extent.x2) / 2;
    const cy = (extent.y1 + extent.y2) / 2;
    const dist2 = (n: CullNode) => (n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy);
    kept = [...inWindow]
      .sort((a, b) => dist2(a) - dist2(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .slice(0, cap);
  }

  const nodeIds = new Set(kept.map((n) => n.id));
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) edgeIds.add(e.id);
  }
  return { nodeIds, edgeIds };
}
