/**
 * Character tagging (spec §9) — find `@key` mentions in prompt text, produce the
 * segments the UI highlights, flag character/image mismatches, and build the
 * clean prompt + ordered reference list a provider request needs.
 *
 * Pure: no React, no I/O. The chosen key convention is `@key` (spec §9.1/§18):
 * fast to type, bounded so it won't match mid-word, easy to colour. Keys are
 * treated case-INSENSITIVELY and canonicalised to lowercase — store
 * `Character.key` lowercase to match.
 */

/** A minimal character shape — only what tagging needs (subset of `Character`). */
export interface TaggableCharacter {
  key: string;
  images: string[];
}

/** One `@key` occurrence located in the text. */
export interface CharacterRef {
  /** Canonical (lowercased) key, without the `@`. */
  key: string;
  /** The matched substring exactly as written, including `@` (for display). */
  raw: string;
  /** Character offset of the `@` in the source text. */
  start: number;
  /** Character offset one past the end of the match. */
  end: number;
}

/**
 * `@key` matcher. The lookbehind stops it firing inside a word (so `foo@bar` and
 * an email local part are NOT mentions); a key is one or more Unicode letters /
 * digits / underscores, so Vietnamese keys work too.
 */
const MENTION = /(?<![\p{L}\p{N}_])@([\p{L}\p{N}_]+)/gu;

/** Lowercase set of allowed keys, or `null` when every `@token` should count. */
function keySet(keys?: readonly string[]): Set<string> | null {
  return keys ? new Set(keys.map((k) => k.toLowerCase())) : null;
}

/**
 * All `@key` mentions in `text`, in order. With `keys` given, only mentions whose
 * key is in that list are returned (so `@unknown` is ignored); without it, every
 * `@token` is a mention (used to DISCOVER keys, e.g. detecting unknowns).
 */
export function findCharacterRefs(text: string, keys?: readonly string[]): CharacterRef[] {
  const allowed = keySet(keys);
  const out: CharacterRef[] = [];
  for (const m of text.matchAll(MENTION)) {
    const key = m[1]!.toLowerCase();
    if (allowed && !allowed.has(key)) continue;
    const start = m.index;
    out.push({ key, raw: m[0], start, end: start + m[0].length });
  }
  return out;
}

/** Distinct keys mentioned in `text`, in first-appearance order (fills `Scene.characterKeys`). */
export function characterKeysInText(text: string, keys?: readonly string[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const ref of findCharacterRefs(text, keys)) {
    if (!seen.has(ref.key)) {
      seen.add(ref.key);
      order.push(ref.key);
    }
  }
  return order;
}

/** A run of text; `key` is set on the runs that are a `@key` mention. */
export interface HighlightSegment {
  text: string;
  /** Canonical key when this run is a mention; absent for plain text. */
  key?: string;
}

/**
 * Split `text` into alternating plain / mention segments for the highlighter
 * (spec §9.2). Only mentions of a known `key` are highlighted; the run's `text`
 * is the original substring (including `@`) so the editor shows what was typed.
 * The UI colours a segment by looking `key` up in the character list — colour is
 * DATA, never decided here (spec §13.5).
 */
export function highlightSegments(text: string, keys: readonly string[]): HighlightSegment[] {
  const refs = findCharacterRefs(text, keys);
  if (refs.length === 0) return text ? [{ text }] : [];
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const ref of refs) {
    if (ref.start > cursor) segments.push({ text: text.slice(cursor, ref.start) });
    segments.push({ text: ref.raw, key: ref.key });
    cursor = ref.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/* ============================================================
   Character / image consistency checks (spec §9.2)
   ============================================================ */

/** A code the UI maps to a `t('...')` warning — never localised prose here. */
export type CharacterIssueCode =
  /** A key is mentioned in a scene but its character has no reference image. */
  | 'missing-image'
  /** A character has images but no scene mentions it. */
  | 'unused-character'
  /** A `@token` is mentioned that matches no defined character. */
  | 'unknown-key';

export interface CharacterIssue {
  code: CharacterIssueCode;
  key: string;
}

/**
 * Cross-check the character roster against the scene prompts (spec §9.2):
 *  - mentioned but no image  → `missing-image`
 *  - has an image but unused  → `unused-character`
 *  - mentioned but undefined  → `unknown-key`
 * Returns codes for the UI to translate. Order: issues follow the character list,
 * then unknown keys in first-appearance order.
 */
export function checkCharacters(
  characters: readonly TaggableCharacter[],
  sceneTexts: readonly string[],
): CharacterIssue[] {
  const known = new Map(characters.map((c) => [c.key.toLowerCase(), c]));
  const mentioned = new Set<string>();
  const unknownOrder: string[] = [];
  const seenUnknown = new Set<string>();

  for (const text of sceneTexts) {
    for (const ref of findCharacterRefs(text)) {
      mentioned.add(ref.key);
      if (!known.has(ref.key) && !seenUnknown.has(ref.key)) {
        seenUnknown.add(ref.key);
        unknownOrder.push(ref.key);
      }
    }
  }

  const issues: CharacterIssue[] = [];
  for (const c of characters) {
    const key = c.key.toLowerCase();
    const used = mentioned.has(key);
    const hasImage = c.images.length > 0;
    if (used && !hasImage) issues.push({ code: 'missing-image', key });
    else if (!used && hasImage) issues.push({ code: 'unused-character', key });
  }
  for (const key of unknownOrder) issues.push({ code: 'unknown-key', key });
  return issues;
}

/* ============================================================
   Building the provider request prompt (spec §9.3 — level 1)
   ============================================================ */

/** How `@key` tokens are rewritten when building the outgoing prompt. */
export type PromptMarkerMode =
  /** Drop the `@`, keep the word: `@an` → `an`. Minimal, safe default. */
  | 'strip'
  /** Replace with the character's display name: `@an` → `An`. */
  | 'name'
  /** Replace with "reference image N", N being the ref's 1-based slot (Veo ingredients). */
  | 'reference';

export interface BuildScenePromptInput {
  text: string;
  /** Full character roster (needs key + images + optional displayName). */
  characters: readonly (TaggableCharacter & { displayName?: string })[];
  /** How to rewrite the tokens. Default `'strip'`. */
  mode?: PromptMarkerMode;
  /** Max reference images the provider accepts (spec §9.4). Extra keys are dropped. */
  maxReferenceImages?: number;
}

export interface BuiltScenePrompt {
  /** The cleaned prompt to send to the provider (no `@` markers). */
  prompt: string;
  /**
   * Keys to attach as reference images, in first-appearance order, capped to
   * `maxReferenceImages`, and only for characters that HAVE at least one image.
   */
  referenceKeys: string[];
  /** Keys that were dropped because the reference-image cap was exceeded (spec §9.4). */
  overflowKeys: string[];
}

/**
 * Build the outgoing request for one scene (spec §9.3, level 1 = direct
 * reference images). Produces (a) a clean prompt with `@key` rewritten per `mode`
 * and (b) the ordered, capped list of character keys to attach as reference
 * images — the concrete mechanism behind "the AI knows which key ↔ which image".
 *
 * Only characters with an image can be a reference; mentioned-but-imageless keys
 * still get rewritten in the text but never enter `referenceKeys` (that mismatch
 * is what `checkCharacters` flags). When more distinct referable keys appear than
 * the provider allows, the overflow is reported, not silently sent (spec §9.4).
 */
export function buildScenePrompt(input: BuildScenePromptInput): BuiltScenePrompt {
  const { text, characters, mode = 'strip', maxReferenceImages = Infinity } = input;
  const byKey = new Map(characters.map((c) => [c.key.toLowerCase(), c]));

  // Referable keys = mentioned, defined, and with at least one image — in order.
  const referable = characterKeysInText(text).filter((k) => (byKey.get(k)?.images.length ?? 0) > 0);
  const referenceKeys = referable.slice(0, maxReferenceImages);
  const overflowKeys = referable.slice(maxReferenceImages);
  const slot = new Map(referenceKeys.map((k, i) => [k, i + 1]));

  const prompt = replaceMentions(text, (key) => {
    const char = byKey.get(key);
    if (mode === 'reference') {
      const n = slot.get(key);
      return n ? `reference image ${n}` : char?.displayName ?? key;
    }
    if (mode === 'name') return char?.displayName ?? key;
    return key; // 'strip'
  });

  return { prompt, referenceKeys, overflowKeys };
}

/** Rewrite every `@key` mention via `fn(key)`, leaving the rest of the text as-is. */
function replaceMentions(text: string, fn: (key: string) => string): string {
  return text.replace(MENTION, (_full, k: string) => fn(k.toLowerCase()));
}
