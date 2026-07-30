/**
 * File System Access API (spec §12): người dùng chọn 1 thư mục / 1 lần cho mẻ; app
 * ghi thẳng video (kèm subfolder theo cảnh) vào đó. Chỉ Chromium (Chrome/Edge) —
 * nơi khác không có `showDirectoryPicker` → gọi kèm fallback `downloadBlob`.
 *
 * Trình duyệt CỐ TÌNH giấu đường dẫn tuyệt đối; ta chỉ thao tác qua handle + đường
 * dẫn tương đối trong thư mục user đã chọn.
 */

type DirPicker = (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;

function picker(): DirPicker | undefined {
  return (window as unknown as { showDirectoryPicker?: DirPicker }).showDirectoryPicker;
}

/** Có hỗ trợ chọn thư mục (Chromium) không. */
export function isDirectoryPickerSupported(): boolean {
  return typeof picker() === 'function';
}

/** Mở hộp thoại chọn thư mục (xin quyền ghi). `null` nếu không hỗ trợ / user huỷ. */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const p = picker();
  if (!p) return null;
  try {
    return await p({ mode: 'readwrite' });
  } catch {
    return null; // user huỷ hoặc từ chối quyền
  }
}

/** Ghi 1 file vào thư mục gốc, tự tạo các subfolder theo `relPath` (vd `proj/Canh 01/v1.mp4`). */
export async function writeFileToDir(
  root: FileSystemDirectoryHandle,
  relPath: string,
  data: Blob | string,
): Promise<void> {
  const parts = relPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error('Đường dẫn file rỗng');
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
  const fh = await dir.getFileHandle(fileName, { create: true });
  const writable = await fh.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

/**
 * Fallback khi không dùng được File System Access: tải blob về Downloads. Chrome cho
 * phép `download="a/b/c.mp4"` tạo subfolder trong Downloads nên vẫn giữ được cấu trúc.
 */
export function downloadBlob(data: Blob, filename: string): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
