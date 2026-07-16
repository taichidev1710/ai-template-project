import type { NodeShape } from '../types';

/** SVG clip-paths approximating each canvas node shape, for list previews. */
const CLIP: Record<NodeShape, string> = {
  ellipse: 'ellipse(50% 50% at 50% 50%)',
  'round-rectangle': 'inset(10% 6% round 22%)',
  rectangle: 'inset(12% 4%)',
  hexagon: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
  diamond: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
  triangle: 'polygon(50% 4%, 96% 96%, 4% 96%)',
  star: 'polygon(50% 2%, 61% 38%, 98% 38%, 68% 60%, 79% 96%, 50% 74%, 21% 96%, 32% 60%, 2% 38%, 39% 38%)',
  barrel: 'inset(6% 12% round 40% / 22%)',
};

interface BlockGlyphProps {
  shape: NodeShape;
  color: string;
  size?: number;
}

/** A small filled preview of a block's shape + color. */
export function BlockGlyph({ shape, color, size = 24 }: BlockGlyphProps) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, background: color, clipPath: CLIP[shape], display: 'inline-block', flex: 'none' }}
    />
  );
}
