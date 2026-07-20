// Public API of the relation-types feature — import from here, not from internals.
export { RelationsPanel } from './components/RelationsPanel';
export { RelationLinePreview } from './components/RelationLinePreview';
/** Shared with the rule builder: a forbid rule may spell out a path inline. */
export { PatternBuilder } from './components/PatternBuilder';
export type { Relation, RelationInput } from './types';
/** Style vocabularies + their glyphs, shared with the per-edge override form. */
export { ARROW_OPTIONS, CURVE_OPTIONS, LINE_OPTIONS } from './types';
export { ArrowGlyph, CurveGlyph, LineGlyph } from './components/StyleGlyphs';
