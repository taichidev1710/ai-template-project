/**
 * Cytoscape stylesheet, built FROM design tokens.
 *
 * The demo hardcoded its hexes; here every themeable colour comes from the token
 * set, so the canvas follows light/dark like the rest of the app. Node and edge
 * colours are NOT tokens — they are user data (block type / relation style) and
 * arrive through each element's `data`.
 *
 * Data-driven properties use FUNCTION mappers rather than `'data(x)'` strings:
 * `@types/cytoscape` cannot type the string form, and the function form is both
 * type-safe and equivalent at runtime.
 */
import type cytoscape from 'cytoscape';
import type { ArrowShape, LineStyle, NodeShape } from '@/domain/diagram';
import { lineSpec } from './cy-elements';

/** Every domain line style, resolved by selector (see `edgeStyleData`). */
const LINE_STYLES: LineStyle[] = ['solid', 'dashed', 'dotted', 'dots-lg', 'dashdot', 'longdash'];

/** The slice of the AntD token set the canvas needs. */
export interface CanvasTheme {
  colorText: string;
  colorTextSecondary: string;
  colorBgContainer: string;
  colorBorder: string;
  colorError: string;
  colorWarning: string;
  colorSuccess: string;
  fontFamily: string;
}

type CyLineStyle = 'solid' | 'dashed' | 'dotted';
type CyCurve = 'straight' | 'taxi' | 'unbundled-bezier' | 'segments';

/**
 * `edgeLabels` (all) and `hiddenLabels` (per relation) are baked in here rather
 * than patched on afterwards: a later `cy.style().selector('edge')` call would
 * replace the label mapper and silently drop the relation-name fallback below.
 */
export function buildStylesheet(
  t: CanvasTheme,
  reducedMotion: boolean,
  edgeLabels: boolean,
  hiddenLabels: string[] = [],
): cytoscape.StylesheetJson {
  const transition = reducedMotion ? 0 : 180;
  const muted = new Set(hiddenLabels);

  return [
    {
      selector: 'node',
      style: {
        shape: (e: cytoscape.NodeSingular) => e.data('shape') as NodeShape,
        'background-color': (e: cytoscape.NodeSingular) => String(e.data('color')),
        width: 54,
        height: 54,
        // Two live counters ride the label as DATA, never as defs, so neither
        // triggers a rebuild: `hc` (⊕N — blocks hidden under a collapsed
        // branch, set at mark time) and `fl` (⇢N — links the viewport window
        // could not draw, set on every window refresh).
        label: (e: cytoscape.NodeSingular) => {
          const base = String(e.data('label') ?? '');
          const hc = Number(e.data('hc') ?? 0);
          const fl = Number(e.data('fl') ?? 0);
          return `${base}${hc > 0 ? ` ⊕${hc}` : ''}${fl > 0 ? ` ⇢${fl}` : ''}`;
        },
        color: t.colorText,
        'font-family': t.fontFamily,
        'font-size': 12,
        'font-weight': 500,
        'text-valign': 'bottom',
        'text-margin-y': 7,
        'text-wrap': 'ellipsis',
        'text-max-width': '110',
        'border-width': 2,
        'border-color': t.colorBorder,
        'border-opacity': 0.85,
        'overlay-color': t.colorWarning,
        'overlay-padding': 6,
        'transition-property': 'background-color, border-color, opacity',
        'transition-duration': transition,
      },
    },
    {
      selector: 'node[image]',
      style: {
        'background-image': (e: cytoscape.NodeSingular) => String(e.data('image')),
        'background-fit': 'cover',
      },
    },
    // `exempt` nodes (the demo's "chưa xác định") opt out of `require` rules —
    // show that they are deliberately incomplete rather than merely unfilled.
    {
      selector: 'node[?unk]',
      style: {
        'border-style': 'dashed',
        'background-opacity': 0.45,
        color: t.colorTextSecondary,
      },
    },
    { selector: 'node:selected', style: { 'border-width': 4, 'border-color': t.colorWarning, 'border-opacity': 1 } },
    {
      selector: 'node.collapsed',
      style: { 'border-width': 4, 'border-color': t.colorWarning, 'border-style': 'double', 'border-opacity': 1 },
    },
    // The node picked as the source while drawing a link.
    { selector: 'node.linksrc', style: { 'border-width': 5, 'border-color': t.colorSuccess, 'border-opacity': 1 } },

    {
      selector: 'edge',
      style: {
        'curve-style': (e: cytoscape.EdgeSingular) => e.data('curve') as CyCurve,
        width: (e: cytoscape.EdgeSingular) => Number(e.data('width')),
        'line-color': (e: cytoscape.EdgeSingular) => String(e.data('color')),
        'target-arrow-shape': (e: cytoscape.EdgeSingular) => (e.data('arrow') ?? 'none') as ArrowShape,
        'target-arrow-color': (e: cytoscape.EdgeSingular) => String(e.data('color')),
        'arrow-scale': 1.15,
        // An edge with no label of its own falls back to its relation's name —
        // what the link modals promise ("bỏ trống thì hiển thị tên loại quan hệ").
        label: (e: cytoscape.EdgeSingular) => {
          if (!edgeLabels || muted.has(String(e.data('rel')))) return '';
          return String(e.data('label') || e.data('relName') || '');
        },
        'font-size': 10.5,
        'font-family': t.fontFamily,
        color: t.colorTextSecondary,
        'text-background-color': t.colorBgContainer,
        'text-background-opacity': 0.85,
        'text-background-padding': '3',
        'text-background-shape': 'roundrectangle',
        'text-rotation': 'autorotate',
        'transition-property': 'line-color, width, opacity',
        'transition-duration': transition,
      },
    },
    // One selector per line style — `line-dash-pattern` takes a literal array
    // only, so it cannot be data-driven the way colour and width are.
    ...LINE_STYLES.map((line) => {
      const spec = lineSpec(line);
      return {
        selector: `edge[line = "${line}"]`,
        style: {
          'line-style': spec.dash as CyLineStyle,
          'line-dash-pattern': spec.pattern,
          'line-cap': spec.cap,
        },
      };
    }),

    { selector: 'edge[curve = "unbundled-bezier"]', style: { 'control-point-distances': [55], 'control-point-weights': [0.5] } },
    { selector: 'edge[curve = "segments"]', style: { 'segment-distances': [22, -22, 22, -22], 'segment-weights': [0.2, 0.4, 0.6, 0.8] } },
    { selector: 'edge[curve = "taxi"]', style: { 'taxi-direction': 'auto', 'taxi-turn': '50%', 'taxi-turn-min-distance': 18 } },
    { selector: 'edge:selected', style: { 'line-color': t.colorWarning, 'target-arrow-color': t.colorWarning } },

    // Derived relations: faint, and `events: no` so they are never clickable —
    // they do not exist as data, so they must not be selectable or deletable.
    { selector: 'edge.ghostedge', style: { opacity: 0.4, events: 'no', 'z-index': 0 } },

    // Rule violations.
    { selector: 'node.viol', style: { 'underlay-color': t.colorError, 'underlay-opacity': 0.3, 'underlay-padding': 8 } },
    { selector: 'edge.viol', style: { 'underlay-color': t.colorError, 'underlay-opacity': 0.3, 'underlay-padding': 5 } },
  ];
}
