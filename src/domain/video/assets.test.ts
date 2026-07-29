import { describe, it, expect } from 'vitest';
import { sceneAssets, checkAssets } from './assets';
import type { Asset } from './types';

const asset = (id: string, kind: Asset['kind'], key: string, images: string[] = ['img']): Asset => ({
  id,
  kind,
  key,
  displayName: key,
  images,
  color: '#000',
});

const an = asset('a_an', 'character', 'an');
const room = asset('a_room', 'setting', 'phong');
const street = asset('a_street', 'setting', 'pho');
const roster = [an, room, street];

describe('sceneAssets', () => {
  it('collects @key mentions then assigned assets, deduped, in order', () => {
    const scene = { text: '@an bước vào', assetIds: ['a_room'] };
    expect(sceneAssets(scene, roster).map((a) => a.id)).toEqual(['a_an', 'a_room']);
  });

  it('does not duplicate an asset that is both mentioned and assigned', () => {
    const scene = { text: '@an và @phong', assetIds: ['a_room'] };
    expect(sceneAssets(scene, roster).map((a) => a.id)).toEqual(['a_an', 'a_room']);
  });

  it('ignores unknown keys and unknown assigned ids', () => {
    const scene = { text: '@ghost đi', assetIds: ['nope'] };
    expect(sceneAssets(scene, roster)).toEqual([]);
  });

  it('works with no assignment', () => {
    expect(sceneAssets({ text: '@an' }, roster).map((a) => a.id)).toEqual(['a_an']);
  });
});

describe('checkAssets', () => {
  it('treats an ASSIGNED setting as used (no unused-asset warning)', () => {
    const scenes = [{ text: 'con phố về đêm', assetIds: ['a_street'] }];
    expect(checkAssets([street], scenes)).toEqual([]);
  });

  it('flags a setting with an image that is never assigned nor mentioned', () => {
    expect(checkAssets([room], [{ text: 'ngoài trời' }])).toEqual([
      { code: 'unused-asset', assetId: 'a_room', key: 'phong' },
    ]);
  });

  it('flags a mentioned character with no image', () => {
    const noImg = asset('a_x', 'character', 'x', []);
    expect(checkAssets([noImg], [{ text: '@x chạy' }])).toEqual([
      { code: 'missing-image', assetId: 'a_x', key: 'x' },
    ]);
  });

  it('flags an assigned asset with no image', () => {
    const noImg = asset('a_s', 'setting', 's', []);
    expect(checkAssets([noImg], [{ text: 'gì đó', assetIds: ['a_s'] }])).toEqual([
      { code: 'missing-image', assetId: 'a_s', key: 's' },
    ]);
  });

  it('flags an unknown @key that matches no asset', () => {
    expect(checkAssets([], [{ text: '@ghost' }])).toEqual([{ code: 'unknown-key', key: 'ghost' }]);
  });

  it('is quiet when a character is mentioned and has an image', () => {
    expect(checkAssets([an], [{ text: '@an walks' }])).toEqual([]);
  });
});
