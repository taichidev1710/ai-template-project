import { describe, it, expect } from 'vitest';
import { parseScenes, reparseScenes, joinScenes, type MergeableScene } from './sceneParser';

const texts = (source: string, opts?: Parameters<typeof parseScenes>[1]) =>
  parseScenes(source, opts).map((s) => s.text);

describe('parseScenes — blank-line boundary', () => {
  it('splits on a blank line', () => {
    expect(texts('Cảnh một\n\nCảnh hai')).toEqual(['Cảnh một', 'Cảnh hai']);
  });

  it('keeps a single source with no blank line as one scene', () => {
    expect(texts('Chỉ một cảnh duy nhất')).toEqual(['Chỉ một cảnh duy nhất']);
  });

  it('collapses several blank lines in a row into one boundary', () => {
    expect(texts('A\n\n\n\nB')).toEqual(['A', 'B']);
  });

  it('treats a whitespace-only line as blank', () => {
    expect(texts('A\n   \nB')).toEqual(['A', 'B']);
    expect(texts('A\n\t\nB')).toEqual(['A', 'B']);
  });

  it('preserves a soft line break inside a scene', () => {
    expect(texts('dòng một\ndòng hai\n\ncảnh sau')).toEqual(['dòng một\ndòng hai', 'cảnh sau']);
  });

  it('trims each scene but not internal newlines', () => {
    expect(texts('  A  \n\n  B \nC ')).toEqual(['A', 'B \nC']);
  });

  it('drops empty scenes from leading / trailing blank lines', () => {
    expect(texts('\n\nA\n\nB\n\n\n')).toEqual(['A', 'B']);
  });

  it('returns nothing for an empty or whitespace-only prompt', () => {
    expect(texts('')).toEqual([]);
    expect(texts('   \n\n  \n')).toEqual([]);
  });

  it('numbers scenes 1-based and contiguous', () => {
    expect(parseScenes('A\n\nB\n\nC')).toEqual([
      { order: 1, text: 'A' },
      { order: 2, text: 'B' },
      { order: 3, text: 'C' },
    ]);
  });
});

describe('parseScenes — newline flavours', () => {
  it('handles CRLF like LF', () => {
    expect(texts('A\r\n\r\nB')).toEqual(['A', 'B']);
  });
  it('handles a lone CR', () => {
    expect(texts('A\r\rB')).toEqual(['A', 'B']);
  });
});

describe('parseScenes — Unicode & scale', () => {
  it('keeps Vietnamese diacritics intact', () => {
    const s = 'Người đàn ông ở ữ ỡ ẫ\n\nĐường phố về đêm';
    expect(texts(s)).toEqual(['Người đàn ông ở ữ ỡ ẫ', 'Đường phố về đêm']);
  });

  it('parses a very long prompt without choking', () => {
    const blocks = Array.from({ length: 500 }, (_, i) => `Cảnh ${i}`);
    const parsed = parseScenes(blocks.join('\n\n'));
    expect(parsed).toHaveLength(500);
    expect(parsed[499]?.text).toBe('Cảnh 499');
  });
});

describe('parseScenes — marker mode', () => {
  it('is off by default: markers stay part of the text', () => {
    expect(texts('A\n---\nB')).toEqual(['A\n---\nB']);
  });

  it('splits on a horizontal rule when enabled', () => {
    expect(texts('A\n---\nB', { markers: true })).toEqual(['A', 'B']);
    expect(texts('A\n***\nB', { markers: true })).toEqual(['A', 'B']);
  });

  it('splits on a markdown heading and keeps the heading text', () => {
    expect(texts('# Mở đầu\nnội dung', { markers: true })).toEqual(['Mở đầu\nnội dung']);
  });

  it('splits on "Scene N:" / "Cảnh N" and keeps the remainder', () => {
    expect(texts('Scene 1: a man walks\n\nScene 2: he stops', { markers: true })).toEqual([
      'a man walks',
      'he stops',
    ]);
    expect(texts('Cảnh 1 người đi\nCảnh 2 người dừng', { markers: true })).toEqual([
      'người đi',
      'người dừng',
    ]);
  });

  it('splits on a [bracket label]', () => {
    expect(texts('[Cảnh mở] trời mưa\n[Cảnh sau] trời tạnh', { markers: true })).toEqual([
      'trời mưa',
      'trời tạnh',
    ]);
  });

  it('accepts a custom marker pattern', () => {
    expect(texts('A\n===\nB', { markers: true, markerPattern: /^\s*={3,}\s*/ })).toEqual(['A', 'B']);
  });
});

describe('reparseScenes — keep overrides by position', () => {
  const prev: MergeableScene[] = [
    { id: 's1', text: 'old one', aspectOverride: '9:16' },
    { id: 's2', text: 'old two', countOverride: 3 },
  ];

  it('carries id + overrides onto matching positions, takes fresh text', () => {
    const r = reparseScenes(prev, 'new one\n\nnew two');
    expect(r.countChanged).toBe(false);
    expect(r.droppedOverrides).toBe(0);
    expect(r.scenes[0]).toMatchObject({ id: 's1', text: 'new one', aspectOverride: '9:16' });
    expect(r.scenes[1]).toMatchObject({ id: 's2', text: 'new two', countOverride: 3 });
  });

  it('flags a count change and leaves extra scenes plain (no id)', () => {
    const r = reparseScenes(prev, 'one\n\ntwo\n\nthree');
    expect(r.countChanged).toBe(true);
    expect(r.scenes).toHaveLength(3);
    expect(r.scenes[2]).toEqual({ order: 3, text: 'three' });
    expect('id' in r.scenes[2]!).toBe(false);
  });

  it('reports dropped overrides when scenes are removed', () => {
    const r = reparseScenes(prev, 'only one left');
    expect(r.countChanged).toBe(true);
    expect(r.scenes).toHaveLength(1);
    expect(r.droppedOverrides).toBe(1); // s2 had a countOverride and was cut
  });

  it('does not count a removed scene without overrides as dropped', () => {
    const plain: MergeableScene[] = [
      { id: 'a', text: 'a' },
      { id: 'b', text: 'b' },
    ];
    const r = reparseScenes(plain, 'just a');
    expect(r.droppedOverrides).toBe(0);
  });
});

describe('joinScenes — inverse round-trip', () => {
  it('joins with a blank line so re-parsing gives the same split', () => {
    const source = 'Cảnh A\nvới hai dòng\n\nCảnh B';
    const scenes = parseScenes(source);
    const rejoined = joinScenes(scenes);
    expect(parseScenes(rejoined).map((s) => s.text)).toEqual(scenes.map((s) => s.text));
  });

  it('drops empty entries', () => {
    expect(joinScenes([{ text: 'A' }, { text: '  ' }, { text: 'B' }])).toBe('A\n\nB');
  });
});
