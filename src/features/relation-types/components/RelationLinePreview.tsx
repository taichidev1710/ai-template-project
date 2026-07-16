import type { RelationStyle } from '@/domain/diagram';

const DASH: Record<RelationStyle['line'], string> = {
  solid: '',
  dashed: '6 4',
  dotted: '1.5 4',
  dashdot: '8 3 1.5 3',
  longdash: '12 5',
};

/** A small SVG sample of a relation's line style + arrow head. */
export function RelationLinePreview({ style, width = 64 }: { style: RelationStyle; width?: number }) {
  const x2 = style.arrow === 'none' ? width - 4 : width - 12;
  return (
    <svg width={width} height={14} aria-hidden style={{ flex: 'none' }}>
      <line
        x1={2}
        y1={7}
        x2={x2}
        y2={7}
        stroke={style.color}
        strokeWidth={style.width}
        strokeDasharray={DASH[style.line]}
        strokeLinecap="round"
      />
      {style.arrow === 'triangle' && (
        <polygon points={`${x2},2 ${width - 2},7 ${x2},12`} fill={style.color} />
      )}
      {style.arrow === 'vee' && (
        <polyline points={`${x2},2 ${width - 2},7 ${x2},12`} fill="none" stroke={style.color} strokeWidth={style.width} />
      )}
    </svg>
  );
}
