import { describe, it, expect } from 'vitest';
import { buildOutputPath, metadataPathFor, slug } from './outputPath';

describe('output path naming (spec §12)', () => {
  it('builds project/Canh NN/vX_provider_aspect.mp4', () => {
    expect(
      buildOutputPath({ projectName: 'My Ad', sceneOrder: 3, index: 0, provider: 'veo31', aspect: '16:9' }),
    ).toBe('My-Ad/Canh 03/v1_veo31_16x9.mp4');
    expect(
      buildOutputPath({ projectName: 'clip', sceneOrder: 12, index: 1, provider: 'mock', aspect: '9:16' }),
    ).toBe('clip/Canh 12/v2_mock_9x16.mp4');
  });

  it('slug strips unsafe chars and falls back when empty', () => {
    expect(slug('  Dự án #1!! ')).toBe('Dự-án-1');
    expect(slug('***')).toBe('video');
    expect(slug('', 'x')).toBe('x');
  });

  it('metadata path swaps .mp4 for .json', () => {
    expect(metadataPathFor('clip/Canh 01/v1_veo31_16x9.mp4')).toBe('clip/Canh 01/v1_veo31_16x9.json');
  });
});
