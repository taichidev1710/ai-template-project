/**
 * Viewport culling — pick the elements worth mounting for the current view.
 *
 * Cytoscape draws every element it holds each frame, so a diagram of thousands
 * of nodes stays slow even when only a corner is on screen. The demo (demo-sdqh)
 * answered this with `refreshWindow`: mount only what falls in the viewport, plus
 * a cap. This is that decision, pulled out as a pure function so it can be tested
 * without a `cy` instance or a browser.
 *
 * One step beyond the demo: an edge whose OTHER endpoint lies outside the
 * window mounts that far endpoint too (bounded by `extraCap`), because an edge
 * needs both ends to exist in cytoscape. Without this, a block whose partner
 * sits a screen away renders with no line at all and reads as an orphan — the
 * link exists, the view just cut it. Whatever still cannot be drawn is counted
 * per node in `farCut`, so the canvas can say "⇢N links beyond the view"
 * instead of silently lying.
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
   * Hard cap on mounted NODES from the window itself. When more than this fall
   * in the window — a graph zoomed far out — the ones nearest the viewport
   * centre win, so what renders is a bounded slice around where the user is
   * looking rather than everything.
   */
  cap: number;
  /**
   * Hard cap on FAR endpoints mounted on top of the window, one per edge that
   * leaves it. Off-screen by definition, so they cost render bookkeeping only —
   * but a hub with a thousand far links must not drag the whole graph back in.
   */
  extraCap: number;
}

export interface CullResult {
  /** Everything to mount: the window slice plus the far endpoints carried in. */
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  /** True when the cap trimmed the window — the statline's "đang giới hạn". */
  capped: boolean;
  /**
   * For mounted nodes only: how many of their edges STILL cannot be drawn
   * (partner trimmed by `cap`, or `extraCap` ran out). Feeds the ⇢N mark.
   */
  farCut: Map<string, number>;
}

/** Which nodes and edges to mount for `extent`. */
export function visibleWindow({ nodes, edges, extent, margin, cap, extraCap }: CullInput): CullResult {
  const dx = (extent.x2 - extent.x1) * margin;
  const dy = (extent.y2 - extent.y1) * margin;
  const x1 = extent.x1 - dx;
  const x2 = extent.x2 + dx;
  const y1 = extent.y1 - dy;
  const y2 = extent.y2 + dy;
  const cx = (extent.x1 + extent.x2) / 2;
  const cy = (extent.y1 + extent.y2) / 2;
  const dist2 = (n: CullNode) => (n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy);
  /** Deterministic order: distance to the view centre, then id — stable frames. */
  const nearestFirst = (a: CullNode, b: CullNode) =>
    dist2(a) - dist2(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const inWindow = nodes.filter((n) => n.x >= x1 && n.x <= x2 && n.y >= y1 && n.y <= y2);
  const windowIds = new Set(inWindow.map((n) => n.id));

  let kept = inWindow;
  const capped = inWindow.length > cap;
  if (capped) kept = [...inWindow].sort(nearestFirst).slice(0, cap);
  const nodeIds = new Set(kept.map((n) => n.id));

  // Far endpoints: partners OUTSIDE the window whose edge would otherwise be
  // invisible. A partner that IS in the window but lost to the cap stays out —
  // resurrecting it would undo the cap one edge at a time.
  const farWanted = new Map<string, CullNode>();
  for (const e of edges) {
    const sIn = nodeIds.has(e.source);
    const tIn = nodeIds.has(e.target);
    if (sIn === tIn) continue;
    const farId = sIn ? e.target : e.source;
    if (windowIds.has(farId) || farWanted.has(farId)) continue;
    const far = byId.get(farId);
    if (far) farWanted.set(farId, far);
  }
  const extras = [...farWanted.values()].sort(nearestFirst).slice(0, extraCap);
  for (const extra of extras) nodeIds.add(extra.id);

  const edgeIds = new Set<string>();
  const farCut = new Map<string, number>();
  for (const e of edges) {
    const sIn = nodeIds.has(e.source);
    const tIn = nodeIds.has(e.target);
    if (sIn && tIn) {
      edgeIds.add(e.id);
      continue;
    }
    // One end mounted, the other not drawable: count it on the visible end.
    if (sIn) farCut.set(e.source, (farCut.get(e.source) ?? 0) + 1);
    if (tIn) farCut.set(e.target, (farCut.get(e.target) ?? 0) + 1);
  }

  return { nodeIds, edgeIds, capped, farCut };
}
