import { useMemo } from 'react';
import { highlightSegments, type Character } from '@/domain/video';

interface PromptHighlighterProps {
  text: string;
  characters: readonly Character[];
}

/**
 * Renders prompt text with `@key` mentions coloured by the character's own colour
 * (spec §9.2). The colour is DATA carried on the character, so applying it inline
 * is content, not theming — the same way diagram nodes carry their own hex.
 */
export function PromptHighlighter({ text, characters }: PromptHighlighterProps) {
  const colorByKey = useMemo(
    () => new Map(characters.map((c) => [c.key.toLowerCase(), c.color])),
    [characters],
  );
  const keys = useMemo(() => characters.map((c) => c.key).filter(Boolean), [characters]);
  const segments = useMemo(() => highlightSegments(text, keys), [text, keys]);

  return (
    <span className="whitespace-pre-wrap break-words">
      {segments.map((seg, i) =>
        seg.key ? (
          <span key={i} style={{ color: colorByKey.get(seg.key), fontWeight: 600 }}>
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
