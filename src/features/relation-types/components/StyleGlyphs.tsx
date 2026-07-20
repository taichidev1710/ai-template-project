/**
 * Tiny SVG illustrations of the style vocabularies — curve, line, arrow,
 * width — for option pickers: the demo drew every choice next to its name, so
 * picking "Zíc zắc" never required imagining it. Stroked with `currentColor`,
 * so they follow the surrounding text colour in light and dark alike.
 */
import type { ArrowShape, CurveStyle, LineStyle } from '@/domain/diagram';

const LINE_DASH: Record<LineStyle, string> = {
  solid: '',
  dashed: '6 4',
  dotted: '1.5 4',
  'dots-lg': '1.5 7',
  dashdot: '8 3 1.5 3',
  longdash: '12 5',
};

/** A straight sample of a dash pattern; `width` doubles as the width preview. */
export function LineGlyph({ line, width = 2 }: { line: LineStyle; width?: number }) {
  return (
    <svg width={36} height={12} aria-hidden style={{ flex: 'none' }}>
      <line
        x1={2}
        y1={6}
        x2={34}
        y2={6}
        stroke="currentColor"
        strokeWidth={width}
        strokeDasharray={LINE_DASH[line]}
        strokeLinecap="round"
      />
    </svg>
  );
}

const CURVE_PATH: Record<CurveStyle, string> = {
  straight: 'M2 10 L34 4',
  bezier: 'M2 10 C 12 -2, 24 14, 34 3',
  segments: 'M2 10 L11 4 L20 10 L29 4 L34 7',
  taxi: 'M2 11 L16 11 L16 3 L34 3',
};

export function CurveGlyph({ curve }: { curve: CurveStyle }) {
  return (
    <svg width={36} height={14} aria-hidden style={{ flex: 'none' }}>
      <path d={CURVE_PATH[curve]} fill="none" stroke="currentColor" strokeWidth={1.8} />
    </svg>
  );
}

export function ArrowGlyph({ arrow }: { arrow: ArrowShape }) {
  let head = null;
  if (arrow === 'triangle') head = <polygon points="24,1.5 34,6 24,10.5" fill="currentColor" />;
  else if (arrow === 'vee')
    head = <polyline points="24,1.5 34,6 24,10.5" fill="none" stroke="currentColor" strokeWidth={1.8} />;
  else if (arrow === 'circle') head = <circle cx={29} cy={6} r={4} fill="currentColor" />;
  else if (arrow === 'diamond') head = <polygon points="24,6 29,2 34,6 29,10" fill="currentColor" />;
  else if (arrow === 'tee') head = <line x1={32} y1={1} x2={32} y2={11} stroke="currentColor" strokeWidth={2.5} />;
  return (
    <svg width={36} height={12} aria-hidden style={{ flex: 'none' }}>
      <line x1={2} y1={6} x2={arrow === 'none' ? 34 : 24} y2={6} stroke="currentColor" strokeWidth={1.8} />
      {head}
    </svg>
  );
}
