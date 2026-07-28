/**
 * Scene parsing (spec §8) — split one source prompt into an ordered scene list.
 *
 * Pure: no React, no I/O. The default boundary is a BLANK LINE (one line that is
 * empty or whitespace-only). A single line break INSIDE a block is kept, so a
 * multi-line scene survives. An optional marker mode also treats explicit
 * dividers (`---`, `###`, `Scene 1:`, `[Cảnh 2]`) as boundaries.
 */

/** A scene as produced by the parser — no ids yet, just order + text. */
export interface ParsedScene {
  order: number;
  text: string;
}

export interface SceneParseOptions {
  /** Also split on explicit divider lines, not just blank lines (spec §8). */
  markers?: boolean;
  /**
   * Which lines count as a divider when `markers` is on. Matched against a whole
   * line. Any text AFTER the marker token on the same line begins the next scene
   * (so `Scene 1: A man walks` keeps "A man walks"). Default recognises `---`,
   * `***`, `___`, markdown headings, `Scene N` / `Cảnh N`, and `[label]`.
   */
  markerPattern?: RegExp;
}

/**
 * Default divider recognised in marker mode. Group 1 is the marker token to
 * strip; whatever follows on the line is kept as the next scene's opening text.
 */
const DEFAULT_MARKER =
  /^\s*(-{3,}|\*{3,}|_{3,}|#{1,6}|(?:scene|cảnh|canh)\s*\d+\s*[:.)\]-]?|\[[^\]]*\])\s*/i;

/** Normalise CRLF / lone CR to LF so line handling is uniform across platforms. */
function normalizeNewlines(s: string): string {
  return s.replace(/\r\n?/g, '\n');
}

/**
 * Split `source` into scenes. Blank lines are the primary boundary; empty scenes
 * are dropped and each scene is trimmed. Order is 1-based and contiguous.
 *
 * Edge cases handled (spec §8): a single scene (no blank line); several blank
 * lines in a row (collapse to one boundary); a soft line break inside a scene
 * (kept); Unicode / Vietnamese text; a very long prompt (linear scan, no regex
 * backtracking on the whole string).
 */
export function parseScenes(source: string, options: SceneParseOptions = {}): ParsedScene[] {
  const { markers = false, markerPattern = DEFAULT_MARKER } = options;
  const lines = normalizeNewlines(source).split('\n');

  const scenes: string[] = [];
  let current: string[] = [];
  const flush = () => {
    const text = current.join('\n').trim();
    if (text) scenes.push(text);
    current = [];
  };

  for (const line of lines) {
    if (line.trim() === '') {
      // Blank line → scene boundary. Consecutive blanks flush an empty buffer,
      // which `flush` discards, so they collapse to a single boundary.
      flush();
      continue;
    }
    if (markers) {
      const m = markerPattern.exec(line);
      if (m) {
        // A divider line ends the current scene. Text after the marker token on
        // the SAME line opens the next scene (don't lose "Scene 1: <content>").
        flush();
        const remainder = line.slice(m[0].length).trim();
        if (remainder) current.push(remainder);
        continue;
      }
    }
    current.push(line);
  }
  flush();

  return scenes.map((text, i) => ({ order: i + 1, text }));
}

/**
 * A scene the caller already owns, carrying the per-card overrides re-parsing
 * must not throw away (spec §8). Only the fields the merge preserves are needed.
 */
export interface MergeableScene {
  id: string;
  text: string;
  aspectOverride?: unknown;
  countOverride?: unknown;
  [key: string]: unknown;
}

export interface ReparseResult<T extends MergeableScene> {
  /** The reconciled scene list: parsed text, previous overrides kept by position. */
  scenes: (T | ParsedScene)[];
  /** True when the scene COUNT changed — the UI should warn (spec §8). */
  countChanged: boolean;
  /** Previous scenes (by position) whose overrides could not be carried over. */
  droppedOverrides: number;
}

/**
 * Re-parse an edited source prompt while keeping the overrides already set on the
 * old scenes, matched BY POSITION (spec §8: "khớp theo thứ tự + cảnh báo khi số
 * lượng đổi"). Position i in the new list inherits old scene i's id + overrides,
 * taking only the freshly parsed `text`. Extra new scenes are plain `ParsedScene`
 * (no id/overrides); removed old scenes surface as `droppedOverrides` so the UI
 * can warn instead of silently losing a hand-set aspect/count.
 *
 * By position, not by fuzzy text match: text is exactly what the user just
 * edited, so matching on it would fight the edit. Position is stable and
 * predictable, and a count change is flagged loudly rather than guessed around.
 */
export function reparseScenes<T extends MergeableScene>(
  previous: readonly T[],
  source: string,
  options?: SceneParseOptions,
): ReparseResult<T> {
  const parsed = parseScenes(source, options);
  const scenes: (T | ParsedScene)[] = parsed.map((p, i) => {
    const prev = previous[i];
    if (prev) return { ...prev, text: p.text, order: p.order };
    return p;
  });
  const countChanged = parsed.length !== previous.length;
  const droppedOverrides = previous
    .slice(parsed.length)
    .filter((p) => hasOverride(p)).length;
  return { scenes, countChanged, droppedOverrides };
}

function hasOverride(scene: MergeableScene): boolean {
  return scene.aspectOverride !== undefined || scene.countOverride !== undefined;
}

/**
 * Rebuild a single source prompt from a scene list — the inverse of
 * `parseScenes`, for round-tripping the editor (spec §8). Scenes are joined by a
 * blank line, the default boundary, so re-parsing the result yields the same
 * split.
 */
export function joinScenes(scenes: readonly { text: string }[]): string {
  return scenes.map((s) => s.text.trim()).filter(Boolean).join('\n\n');
}
