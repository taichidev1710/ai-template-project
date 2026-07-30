/**
 * Quy ước tên file khi lưu video (spec §12) — dùng chung cho mock lẫn Veo thật.
 * Cấu trúc trong thư mục người dùng chọn:
 *   {projectSlug}/Canh {NN}/v{index+1}_{provider}_{aspect}.mp4
 * → không trùng, sort tự nhiên theo cảnh/biến thể, truy vết được. Mỗi video có 1
 * file .json metadata đi kèm (cùng tên, đuôi .json).
 */
import type { AspectRatio } from '@/domain/video';

/** Slug an toàn cho tên file/thư mục: bỏ ký tự lạ, khoảng trắng → gạch, cắt ngắn. */
export function slug(input: string, fallback = 'video'): string {
  const s = input
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  return s || fallback;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export interface OutputPathInput {
  projectName: string;
  /** Số thứ tự cảnh (1-based). */
  sceneOrder: number;
  /** Biến thể (0-based); tên file dùng v{index+1}. */
  index: number;
  /** Provider id (vd 'veo31', 'mock'). */
  provider: string;
  aspect: AspectRatio;
}

/** Đường dẫn TƯƠNG ĐỐI của video trong thư mục gốc đã chọn. */
export function buildOutputPath(i: OutputPathInput): string {
  const aspect = i.aspect.replace(':', 'x');
  const file = `v${i.index + 1}_${slug(i.provider, 'veo')}_${aspect}.mp4`;
  return `${slug(i.projectName)}/Canh ${pad2(i.sceneOrder)}/${file}`;
}

/** Đường dẫn file .json metadata cạnh video (đổi đuôi .mp4 → .json). */
export function metadataPathFor(videoRelPath: string): string {
  return videoRelPath.replace(/\.mp4$/i, '.json');
}
