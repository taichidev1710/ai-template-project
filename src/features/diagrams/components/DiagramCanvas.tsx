import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { Button, Slider, Tooltip, theme } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import cytoscape from 'cytoscape';
import {
  buildAdjacency,
  computeDerivedPairs,
  isBaseRelation,
  isDerivedRelation,
  type BlockType,
  type Diagram,
  type Relation,
  type Violation,
} from '@/domain/diagram';
import { useThemeStore } from '@/shared/theme';
import { buildStylesheet } from '../canvas/cy-style';
import { visibleWindow } from '../canvas/cull';
import { derivedEdgeDef, edgeDef, nodeDef, type CyElementDef } from '../canvas/cy-elements';

/**
 * Viewport-window constants, straight from the demo: a 35% buffer ring keeps a
 * pan from revealing blank canvas before the debounce fires, and the cap bounds
 * what a fully zoomed-out view can mount at once.
 */
const WINDOW_MARGIN = 0.35;
const WINDOW_CAP = 300;
/**
 * Far endpoints mounted on top of the window so edges leaving it still draw —
 * without them a block whose partner sits a screen away reads as an orphan.
 * Bounded separately from the cap; overflow shows as the ⇢N mark instead.
 */
const WINDOW_EXTRA_CAP = 150;
/** How long a pan/zoom must settle before the window is re-evaluated. */
const WINDOW_DEBOUNCE_MS = 150;

/**
 * The demo's zoom range. Reaching across it with a 0.25-sensitivity wheel takes
 * dozens of notches, hence the slider overlay — its scale is LOGARITHMIC, so
 * each slider step feels like the same relative zoom change.
 */
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 4;
const zoomToSlider = (z: number) => (Math.log(z / MIN_ZOOM) / Math.log(MAX_ZOOM / MIN_ZOOM)) * 100;
const sliderToZoom = (t: number) => MIN_ZOOM * (MAX_ZOOM / MIN_ZOOM) ** (t / 100);

/** What the statline reports about the mounted window. */
export interface WindowStats {
  /** Blocks actually mounted in cytoscape right now. */
  mounted: number;
  /** Blocks the model would show (after visibility filters). */
  total: number;
  /** True while the render cap is trimming the view. */
  capped: boolean;
}

/** Imperative bits the page needs; everything else flows through props. */
export interface DiagramCanvasHandle {
  fit: () => void;
  /** Model coords at the centre of the current viewport — where new nodes land. */
  viewportCenter: () => { x: number; y: number };
  focus: (id: string) => void;
}

interface DiagramCanvasProps {
  diagram: Diagram;
  blockTypes: BlockType[];
  relations: Relation[];
  violations: Violation[];
  /** Node awaiting its link partner, if a link is being drawn. */
  linkSourceId: string | null;
  /**
   * Bump to re-frame the graph. A counter, not a boolean, so two fits in a row
   * are two distinct requests. Fitting is asked for HERE rather than through the
   * `fit()` handle because cytoscape is rebuilt whenever this component
   * remounts (StrictMode does exactly that in dev): a fit driven from the page
   * would land on the instance that is about to be thrown away, and the
   * replacement would come up unframed.
   */
  fitSignal?: number;
  onNodeMove: (id: string, pos: { x: number; y: number }) => void;
  onNodeTap: (id: string) => void;
  onNodeDoubleTap: (id: string) => void;
  onEdgeTap: (id: string) => void;
  onBackgroundTap: () => void;
  /** Fired when the mounted window changes — feeds the statline. */
  onWindowStats?: (stats: WindowStats) => void;
  ref?: Ref<DiagramCanvasHandle>;
}

/**
 * Cytoscape wrapper. `diagram` is the single source of truth: the graph is
 * rebuilt only when its STRUCTURE changes (ids/labels/styles), never when a
 * position changes — otherwise every drag would rebuild and the node would snap
 * back under the cursor. Positions flow one way, canvas → `onNodeMove` → state.
 *
 * Only the slice of the graph inside the viewport window is MOUNTED (the demo's
 * `refreshWindow`): cytoscape redraws every element it holds each frame, so on a
 * big diagram mounting everything makes panning crawl even with most of it off
 * screen. `visibleWindow` picks the slice; pan/zoom re-evaluates it after a
 * debounce. Consequences handled below: fit and focus must work from MODEL
 * positions (the target may not be mounted), and marks/ants re-apply whenever
 * the mounted set changes (`windowVersion`).
 */
export function DiagramCanvas({
  diagram,
  blockTypes,
  relations,
  violations,
  linkSourceId,
  fitSignal = 0,
  onNodeMove,
  onNodeTap,
  onNodeDoubleTap,
  onEdgeTap,
  onBackgroundTap,
  onWindowStats,
  ref,
}: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { token } = theme.useToken();
  const mode = useThemeStore((s) => s.mode);

  // Handlers change identity every render; keep them in a ref so the cy
  // listeners can stay bound for the canvas's whole lifetime.
  const handlers = useRef({ onNodeMove, onNodeTap, onNodeDoubleTap, onEdgeTap, onBackgroundTap, onWindowStats });
  handlers.current = { onNodeMove, onNodeTap, onNodeDoubleTap, onEdgeTap, onBackgroundTap, onWindowStats };

  const { hiddenBlockTypes, hiddenRelations, hiddenLabels, showDerived, showSecondary, edgeLabels, collapsed } =
    diagram.visibility;
  // A stable dep: the array identity changes on every visibility patch, and the
  // stylesheet only needs rebuilding when the CONTENTS move.
  const mutedKey = (hiddenLabels ?? []).join(',');

  /**
   * Nodes hidden because an ancestor's primary subtree is collapsed, plus how
   * many blocks each collapsed root hides — the ⊕N on its label.
   */
  const { collapsedHidden, collapsedCounts } = useMemo(() => {
    const hidden = new Set<string>();
    const counts = new Map<string, number>();
    const primary = relations.find((r) => isBaseRelation(r) && r.role === 'primary');
    if (!primary || collapsed.length === 0) return { collapsedHidden: hidden, collapsedCounts: counts };
    const adj = buildAdjacency(diagram.nodes, diagram.edges, primary.id);
    // Each root walks its OWN subtree: a collapsed root nested inside another
    // fold still shows its own count, so the cycle guard is per root.
    for (const rootId of collapsed) {
      const seen = new Set<string>([rootId]);
      const stack = [rootId];
      while (stack.length > 0) {
        const id = stack.pop() as string;
        for (const child of adj.children.get(id) ?? []) {
          if (seen.has(child)) continue;
          seen.add(child);
          hidden.add(child);
          stack.push(child);
        }
      }
      counts.set(rootId, seen.size - 1);
    }
    return { collapsedHidden: hidden, collapsedCounts: counts };
  }, [diagram.nodes, diagram.edges, relations, collapsed]);

  /** Structural elements — excludes positions (see the component doc). */
  const elements = useMemo(() => {
    const byBlockType = new Map(blockTypes.map((b) => [b.id, b]));
    const byRelation = new Map(relations.map((r) => [r.id, r]));
    const visibleNodeIds = new Set<string>();
    const defs: CyElementDef[] = [];

    for (const node of diagram.nodes) {
      if (hiddenBlockTypes.includes(node.blockTypeId)) continue;
      if (collapsedHidden.has(node.id)) continue;
      visibleNodeIds.add(node.id);
      defs.push(nodeDef(node, byBlockType.get(node.blockTypeId)));
    }

    for (const edge of diagram.edges) {
      // An edge needs both endpoints on screen, or cytoscape rejects it.
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) continue;
      if (hiddenRelations.includes(edge.relationId)) continue;
      const relation = byRelation.get(edge.relationId);
      if (relation && isBaseRelation(relation) && relation.role === 'secondary' && !showSecondary) continue;
      defs.push(edgeDef(edge, relation));
    }

    if (showDerived) {
      for (const relation of relations) {
        if (!isDerivedRelation(relation)) continue;
        if (hiddenRelations.includes(relation.id)) continue;
        for (const pair of computeDerivedPairs(diagram, relation)) {
          if (!visibleNodeIds.has(pair.source) || !visibleNodeIds.has(pair.target)) continue;
          defs.push(derivedEdgeDef(relation.id, pair.source, pair.target, relation.style, relation.name));
        }
      }
    }
    return defs;
  }, [diagram, blockTypes, relations, hiddenBlockTypes, hiddenRelations, showDerived, showSecondary, collapsedHidden]);

  /**
   * Rebuild only when structure changes. Positions are deliberately excluded so
   * dragging never triggers this effect.
   */
  const structureKey = useMemo(
    () =>
      JSON.stringify(
        elements.map((e) => [
          e.data.id,
          e.data.label,
          e.data.color,
          e.data.shape,
          e.data.width,
          e.data.animated,
          // Per-edge style overrides and node images change the DEF, and a def
          // change that this key misses never reaches the canvas.
          e.data.curve,
          e.data.line,
          e.data.arrow,
          e.data.image,
        ]),
      ),
    [elements],
  );

  /** `elements` reshaped for the culler: defs by id, plus geometry-only lists. */
  const windowModel = useMemo(() => {
    const nodeDefs = new Map<string, CyElementDef>();
    const edgeDefs = new Map<string, CyElementDef>();
    for (const def of elements) (def.group === 'nodes' ? nodeDefs : edgeDefs).set(String(def.data.id), def);
    return {
      nodeDefs,
      edgeDefs,
      cullNodes: [...nodeDefs.values()].map((d) => ({
        id: String(d.data.id),
        x: d.position?.x ?? 0,
        y: d.position?.y ?? 0,
      })),
      cullEdges: [...edgeDefs.values()].map((d) => ({
        id: String(d.data.id),
        source: String(d.data.source),
        target: String(d.data.target),
      })),
    };
  }, [elements]);
  // Read through a ref so refreshWindow can stay one stable callback: it is
  // wired into cy's pan/zoom listener once, at mount.
  const windowModelRef = useRef(windowModel);
  windowModelRef.current = windowModel;

  /** Bumped whenever the MOUNTED set changes, so marks and ants re-apply. */
  const [windowVersion, setWindowVersion] = useState(0);
  /** Last stats handed to `onWindowStats` — report only actual changes. */
  const lastStatsRef = useRef<WindowStats | null>(null);
  /** Mirrors `cy.zoom()` so the slider overlay can render it. */
  const [zoomLevel, setZoomLevel] = useState(1);

  /** Zoom about the viewport centre, clamped to the canvas's own range. */
  const applyZoom = useCallback((level: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level)),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  }, []);

  /**
   * Multiply the CURRENT cy zoom — not the mirrored state: two fast clicks in
   * one frame would both read the stale render value and step only once.
   */
  const stepZoom = useCallback(
    (factor: number) => {
      const cy = cyRef.current;
      if (cy) applyZoom(cy.zoom() * factor);
    },
    [applyZoom],
  );

  /** Sync what cytoscape holds to the slice of the model the viewport can see. */
  const refreshWindow = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const { nodeDefs, edgeDefs, cullNodes, cullEdges } = windowModelRef.current;
    const { nodeIds, edgeIds, capped, farCut } = visibleWindow({
      nodes: cullNodes,
      edges: cullEdges,
      extent: cy.extent(),
      margin: WINDOW_MARGIN,
      cap: WINDOW_CAP,
      extraCap: WINDOW_EXTRA_CAP,
    });

    let removed = 0;
    const frag: CyElementDef[] = [];
    cy.batch(() => {
      // Unmount what left the window; connected edges leave with their nodes.
      cy.nodes().forEach((n) => {
        if (!nodeIds.has(n.id())) {
          n.remove();
          removed += 1;
        }
      });
      // Nodes before edges — cytoscape rejects an edge whose endpoint isn't in yet.
      for (const id of nodeIds) {
        const def = nodeDefs.get(id);
        if (!def || !cy.getElementById(id).empty()) continue;
        // Fresh position object: cytoscape keeps (and mutates) what it is handed.
        frag.push({ ...def, position: { x: def.position?.x ?? 0, y: def.position?.y ?? 0 } });
      }
      for (const id of edgeIds) {
        const def = edgeDefs.get(id);
        if (def && cy.getElementById(id).empty()) frag.push(def);
      }
      if (frag.length > 0) cy.add(frag as cytoscape.ElementDefinition[]);
      // ⇢N — links this node has that the window could not draw. Data, not a
      // def: it changes with every pan, and the label mapper reads it live.
      cy.nodes().forEach((el) => {
        const fl = farCut.get(el.id()) ?? 0;
        if ((Number(el.data('fl')) || 0) !== fl) {
          if (fl > 0) el.data('fl', fl);
          else el.removeData('fl');
        }
      });
    });
    if (removed > 0 || frag.length > 0) setWindowVersion((v) => v + 1);

    // Statline feed. Compared to the last report, not to the mutation flags:
    // `capped` can flip while the kept set stays identical.
    const stats = { mounted: cy.nodes().length, total: nodeDefs.size, capped };
    const last = lastStatsRef.current;
    if (!last || last.mounted !== stats.mounted || last.total !== stats.total || last.capped !== stats.capped) {
      lastStatsRef.current = stats;
      handlers.current.onWindowStats?.(stats);
    }
  }, []);

  /**
   * Frame every visible node. `cy.fit` only measures MOUNTED elements — under
   * culling that is just the current window — so the frame is computed from the
   * model instead, demo-style, and the window re-mounted for the new viewport.
   */
  const fitAll = useCallback(() => {
    const cy = cyRef.current;
    const { cullNodes } = windowModelRef.current;
    if (!cy || cullNodes.length === 0) return;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const n of cullNodes) {
      x1 = Math.min(x1, n.x);
      x2 = Math.max(x2, n.x);
      y1 = Math.min(y1, n.y);
      y2 = Math.max(y2, n.y);
    }
    // Node bodies and labels hang off their centre points, hence the wide pad;
    // the 1.2 ceiling stops a two-block diagram from filling the screen.
    const pad = 90;
    const w = cy.width();
    const h = cy.height();
    const zoom = Math.max(
      cy.minZoom(),
      Math.min((w - 2 * pad) / Math.max(1, x2 - x1), (h - 2 * pad) / Math.max(1, y2 - y1), 1.2),
    );
    cy.viewport({ zoom, pan: { x: w / 2 - (zoom * (x1 + x2)) / 2, y: h / 2 - (zoom * (y1 + y2)) / 2 } });
    refreshWindow();
  }, [refreshWindow]);

  useImperativeHandle(
    ref,
    () => ({
      fit: fitAll,
      viewportCenter: () => {
        const cy = cyRef.current;
        if (!cy) return { x: 0, y: 0 };
        const e = cy.extent();
        return { x: Math.round((e.x1 + e.x2) / 2), y: Math.round((e.y1 + e.y2) / 2) };
      },
      focus: (id: string) => {
        const cy = cyRef.current;
        if (!cy) return;
        // The target may be culled, so aim by MODEL position: a node's own, or
        // the midpoint of an edge's endpoints (violations focus edges too).
        const { nodeDefs, edgeDefs } = windowModelRef.current;
        let pos = nodeDefs.get(id)?.position;
        if (!pos) {
          const edge = edgeDefs.get(id);
          const s = edge && nodeDefs.get(String(edge.data.source))?.position;
          const t = edge && nodeDefs.get(String(edge.data.target))?.position;
          if (s && t) pos = { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 };
        }
        if (!pos) return;
        const { x, y } = pos;
        const zoom = cy.zoom();
        cy.animate({
          pan: { x: cy.width() / 2 - zoom * x, y: cy.height() / 2 - zoom * y },
          duration: 220,
          // Select AFTER landing: only then has refreshWindow mounted the target.
          complete: () => {
            refreshWindow();
            cy.elements().unselect();
            cy.getElementById(id).select();
          },
        });
      },
    }),
    [fitAll, refreshWindow],
  );

  // Mount once; never re-create on data change.
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      // 0.2 could not take in a thousand-block diagram at once — and culling
      // caps what a wide view mounts, so deep zoom-out is cheap now.
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      wheelSensitivity: 0.25,
      layout: { name: 'preset' },
    });
    cyRef.current = cy;

    cy.on('dragfree', 'node', (evt) => {
      const pos = evt.target.position();
      handlers.current.onNodeMove(evt.target.id(), { x: Math.round(pos.x), y: Math.round(pos.y) });
    });
    cy.on('tap', 'node', (evt) => handlers.current.onNodeTap(evt.target.id()));
    cy.on('dbltap', 'node', (evt) => handlers.current.onNodeDoubleTap(evt.target.id()));
    cy.on('tap', 'edge', (evt) => handlers.current.onEdgeTap(evt.target.id()));
    cy.on('tap', (evt) => {
      if (evt.target === cy) handlers.current.onBackgroundTap();
    });

    // Moving the viewport changes what falls in the window. Debounced: a wheel
    // spin or drag-pan fires dozens of events, and the buffer ring means the
    // in-between frames already have content.
    let timer = 0;
    cy.on('pan zoom', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(refreshWindow, WINDOW_DEBOUNCE_MS);
    });
    // Undebounced on purpose: the slider must track the wheel live.
    cy.on('zoom', () => setZoomLevel(cy.zoom()));

    return () => {
      window.clearTimeout(timer);
      cy.destroy();
      cyRef.current = null;
    };
  }, [refreshWindow]);

  // Restyle on theme / edge-label change without touching the graph.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cy.style(
      buildStylesheet(
        {
          colorText: token.colorText,
          colorTextSecondary: token.colorTextSecondary,
          colorBgContainer: token.colorBgContainer,
          colorBorder: token.colorBorder,
          colorError: token.colorError,
          colorWarning: token.colorWarning,
          colorSuccess: token.colorSuccess,
          fontFamily: token.fontFamily,
        },
        reduced,
        edgeLabels,
        mutedKey ? mutedKey.split(',') : [],
      ),
    );
  }, [token, mode, edgeLabels, mutedKey]);

  // Sync graph structure: clear, then let refreshWindow mount the visible slice.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().remove();
    refreshWindow();
  }, [structureKey, refreshWindow]);

  // Frame the graph on request. Declared AFTER the sync above so that on any
  // pass — first mount, or a remount — the elements are already in place by the
  // time this runs. Deliberately NOT keyed on `structureKey`: adding one block
  // must not yank the viewport out from under the person who placed it.
  useEffect(() => {
    if (fitSignal > 0) fitAll();
  }, [fitSignal, fitAll]);

  /**
   * Marching ants: walk `line-dash-offset` on every animated edge each frame.
   * Cytoscape has no built-in dash animation, so this drives it by hand (the
   * demo's `dashLoop`). Skipped entirely under prefers-reduced-motion, and the
   * loop only runs while at least one edge actually animates — an idle diagram
   * costs nothing.
   */
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const animated = cy.edges('[?animated]');
    if (animated.length === 0) return;

    let raf = 0;
    const step = (ts: number) => {
      // Negative: the dashes travel from source toward target.
      const offset = -((ts / 40) % 1000);
      cy.batch(() => animated.style('line-dash-offset', offset));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [windowVersion]);

  // Violation + collapse + link-source marks. Keyed on `windowVersion`, not
  // `structureKey`: a pan can mount a marked node that missed the last pass.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass('viol collapsed linksrc');
      cy.nodes().removeData('hc');
      for (const v of violations) cy.getElementById(v.id).addClass('viol');
      for (const id of collapsed) {
        const el = cy.getElementById(id);
        el.addClass('collapsed');
        // `hc` puts ⊕N on the label (see the stylesheet's node label mapper).
        el.data('hc', collapsedCounts.get(id) ?? 0);
      }
      if (linkSourceId) cy.getElementById(linkSourceId).addClass('linksrc');
    });
  }, [violations, collapsed, collapsedCounts, linkSourceId, windowVersion]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full rounded-app bg-canvas" data-testid="diagram-canvas" />
      {/* Zoom overlay: wheel-only travel across 0.02→4 takes dozens of notches. */}
      <div
        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-app bg-surface px-2 py-1 shadow-sm"
        data-testid="canvas-zoombar"
      >
        <Button
          size="small"
          type="text"
          aria-label="Thu nhỏ"
          icon={<ZoomOutOutlined />}
          onClick={() => stepZoom(1 / 1.5)}
        />
        <Slider
          className="!my-0 w-24 sm:w-32"
          min={0}
          max={100}
          step={1}
          tooltip={{ formatter: null }}
          value={zoomToSlider(zoomLevel)}
          onChange={(t) => applyZoom(sliderToZoom(t))}
        />
        <Button
          size="small"
          type="text"
          aria-label="Phóng to"
          icon={<ZoomInOutlined />}
          onClick={() => stepZoom(1.5)}
        />
        <Tooltip title="Về 100%">
          <Button size="small" type="text" className="w-12 !px-0 tabular-nums" onClick={() => applyZoom(1)}>
            {Math.round(zoomLevel * 100)}%
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
