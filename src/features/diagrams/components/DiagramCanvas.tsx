import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { theme } from 'antd';
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
import { derivedEdgeDef, edgeDef, nodeDef, type CyElementDef } from '../canvas/cy-elements';

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
  ref?: Ref<DiagramCanvasHandle>;
}

/**
 * Cytoscape wrapper. `diagram` is the single source of truth: the graph is
 * rebuilt only when its STRUCTURE changes (ids/labels/styles), never when a
 * position changes — otherwise every drag would rebuild and the node would snap
 * back under the cursor. Positions flow one way, canvas → `onNodeMove` → state.
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
  ref,
}: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { token } = theme.useToken();
  const mode = useThemeStore((s) => s.mode);

  // Handlers change identity every render; keep them in a ref so the cy
  // listeners can stay bound for the canvas's whole lifetime.
  const handlers = useRef({ onNodeMove, onNodeTap, onNodeDoubleTap, onEdgeTap, onBackgroundTap });
  handlers.current = { onNodeMove, onNodeTap, onNodeDoubleTap, onEdgeTap, onBackgroundTap };

  useImperativeHandle(ref, () => ({
    fit: () => cyRef.current?.fit(undefined, 48),
    viewportCenter: () => {
      const cy = cyRef.current;
      if (!cy) return { x: 0, y: 0 };
      const e = cy.extent();
      return { x: Math.round((e.x1 + e.x2) / 2), y: Math.round((e.y1 + e.y2) / 2) };
    },
    focus: (id: string) => {
      const cy = cyRef.current;
      const el = cy?.getElementById(id);
      if (!cy || !el || el.empty()) return;
      cy.animate({ center: { eles: el }, duration: 220 });
      cy.elements().unselect();
      el.select();
    },
  }));

  const { hiddenBlockTypes, hiddenRelations, showDerived, showSecondary, edgeLabels, collapsed } = diagram.visibility;

  /** Nodes hidden because an ancestor's primary subtree is collapsed. */
  const collapsedHidden = useMemo(() => {
    const hidden = new Set<string>();
    const primary = relations.find((r) => isBaseRelation(r) && r.role === 'primary');
    if (!primary || collapsed.length === 0) return hidden;
    const adj = buildAdjacency(diagram.nodes, diagram.edges, primary.id);
    const walk = (id: string) => {
      for (const child of adj.children.get(id) ?? []) {
        if (hidden.has(child)) continue;
        hidden.add(child);
        walk(child);
      }
    };
    for (const rootId of collapsed) walk(rootId);
    return hidden;
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
          defs.push(derivedEdgeDef(relation.id, pair.source, pair.target, relation.style));
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
        elements.map((e) => [e.data.id, e.data.label, e.data.color, e.data.shape, e.data.width, e.data.animated]),
      ),
    [elements],
  );

  // Mount once; never re-create on data change.
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      minZoom: 0.2,
      maxZoom: 3,
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

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

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
      ),
    );
  }, [token, mode, edgeLabels]);

  // Sync graph structure.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const positions = new Map(diagram.nodes.map((n) => [n.id, n.pos]));
    cy.batch(() => {
      cy.elements().remove();
      cy.add(
        elements.map((def) =>
          def.group === 'nodes' ? { ...def, position: { ...(positions.get(String(def.data.id)) ?? { x: 0, y: 0 }) } } : def,
        ) as cytoscape.ElementDefinition[],
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  // Frame the graph on request. Declared AFTER the sync above so that on any
  // pass — first mount, or a remount — the elements are already in place by the
  // time this runs. Deliberately NOT keyed on `structureKey`: adding one block
  // must not yank the viewport out from under the person who placed it.
  useEffect(() => {
    if (fitSignal > 0) cyRef.current?.fit(undefined, 48);
  }, [fitSignal]);

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
  }, [structureKey]);

  // Violation + collapse + link-source marks.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass('viol collapsed linksrc');
      for (const v of violations) cy.getElementById(v.id).addClass('viol');
      for (const id of collapsed) cy.getElementById(id).addClass('collapsed');
      if (linkSourceId) cy.getElementById(linkSourceId).addClass('linksrc');
    });
  }, [violations, collapsed, linkSourceId, structureKey]);

  return <div ref={containerRef} className="h-full w-full rounded-app bg-canvas" data-testid="diagram-canvas" />;
}
