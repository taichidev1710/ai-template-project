import { describe, it, expect } from 'vitest';
import {
  findCharacterRefs,
  characterKeysInText,
  highlightSegments,
  checkCharacters,
  buildScenePrompt,
} from './characterTagger';

describe('findCharacterRefs', () => {
  it('finds a mention with its position', () => {
    expect(findCharacterRefs('@an walks')).toEqual([
      { key: 'an', raw: '@an', start: 0, end: 3 },
    ]);
  });

  it('is case-insensitive and canonicalises the key to lowercase', () => {
    const refs = findCharacterRefs('hello @An');
    expect(refs[0]).toMatchObject({ key: 'an', raw: '@An', start: 6 });
  });

  it('does not fire inside a word (email local part is safe)', () => {
    expect(findCharacterRefs('mail foo@bar.com now')).toEqual([]);
  });

  it('filters to a provided key list', () => {
    const refs = findCharacterRefs('@an and @bob', ['an']);
    expect(refs.map((r) => r.key)).toEqual(['an']);
  });

  it('matches Unicode/Vietnamese keys', () => {
    expect(findCharacterRefs('@nhân_vật đi').map((r) => r.key)).toEqual(['nhân_vật']);
  });

  it('finds several mentions in order', () => {
    expect(findCharacterRefs('@a then @b then @a').map((r) => r.start)).toEqual([0, 8, 16]);
  });
});

describe('characterKeysInText', () => {
  it('returns distinct keys in first-appearance order', () => {
    expect(characterKeysInText('@bob meets @an, then @bob again')).toEqual(['bob', 'an']);
  });
  it('returns nothing when there are no mentions', () => {
    expect(characterKeysInText('a quiet street at night')).toEqual([]);
  });
});

describe('highlightSegments', () => {
  it('splits into plain and mention runs, keeping original casing', () => {
    expect(highlightSegments('hi @An bye', ['an'])).toEqual([
      { text: 'hi ' },
      { text: '@An', key: 'an' },
      { text: ' bye' },
    ]);
  });

  it('only highlights known keys', () => {
    expect(highlightSegments('@an and @stranger', ['an'])).toEqual([
      { text: '@an', key: 'an' },
      { text: ' and @stranger' },
    ]);
  });

  it('handles a mention at the very start and end', () => {
    expect(highlightSegments('@an', ['an'])).toEqual([{ text: '@an', key: 'an' }]);
  });

  it('returns one plain run when there are no mentions', () => {
    expect(highlightSegments('just text', ['an'])).toEqual([{ text: 'just text' }]);
  });

  it('returns nothing for empty text', () => {
    expect(highlightSegments('', ['an'])).toEqual([]);
  });
});

describe('checkCharacters', () => {
  const withImg = (key: string) => ({ key, images: ['data:img'] });
  const noImg = (key: string) => ({ key, images: [] });

  it('flags a mentioned character that has no image', () => {
    expect(checkCharacters([noImg('an')], ['@an walks'])).toEqual([
      { code: 'missing-image', key: 'an' },
    ]);
  });

  it('flags a character with an image that no scene uses', () => {
    expect(checkCharacters([withImg('bob')], ['a quiet street'])).toEqual([
      { code: 'unused-character', key: 'bob' },
    ]);
  });

  it('flags a mention that matches no defined character', () => {
    expect(checkCharacters([], ['@ghost appears'])).toEqual([
      { code: 'unknown-key', key: 'ghost' },
    ]);
  });

  it('is quiet when a character is used and has an image', () => {
    expect(checkCharacters([withImg('an')], ['@an walks'])).toEqual([]);
  });

  it('reports character issues before unknown keys', () => {
    const issues = checkCharacters([noImg('an')], ['@an meets @ghost']);
    expect(issues).toEqual([
      { code: 'missing-image', key: 'an' },
      { code: 'unknown-key', key: 'ghost' },
    ]);
  });
});

describe('buildScenePrompt', () => {
  const chars = [
    { key: 'an', displayName: 'An', images: ['a'] },
    { key: 'bob', displayName: 'Bob', images: ['b'] },
  ];

  it("strips markers by default and lists reference keys in order", () => {
    const r = buildScenePrompt({ text: '@an meets @bob', characters: chars });
    expect(r.prompt).toBe('an meets bob');
    expect(r.referenceKeys).toEqual(['an', 'bob']);
    expect(r.overflowKeys).toEqual([]);
  });

  it("mode 'name' swaps in the display name", () => {
    const r = buildScenePrompt({ text: '@an waves', characters: chars, mode: 'name' });
    expect(r.prompt).toBe('An waves');
  });

  it("mode 'reference' maps to numbered reference slots", () => {
    const r = buildScenePrompt({ text: '@an and @bob', characters: chars, mode: 'reference' });
    expect(r.prompt).toBe('reference image 1 and reference image 2');
  });

  it('excludes imageless characters from reference keys', () => {
    const c = [{ key: 'an', images: [] as string[] }, { key: 'bob', images: ['b'] }];
    const r = buildScenePrompt({ text: '@an and @bob', characters: c });
    expect(r.referenceKeys).toEqual(['bob']);
  });

  it('caps reference keys and reports the overflow (spec §9.4)', () => {
    const r = buildScenePrompt({
      text: '@an @bob',
      characters: chars,
      maxReferenceImages: 1,
    });
    expect(r.referenceKeys).toEqual(['an']);
    expect(r.overflowKeys).toEqual(['bob']);
  });

  it("mode 'reference' falls back to a name for overflowed keys", () => {
    const r = buildScenePrompt({
      text: '@an @bob',
      characters: chars,
      mode: 'reference',
      maxReferenceImages: 1,
    });
    expect(r.prompt).toBe('reference image 1 Bob');
  });
});
