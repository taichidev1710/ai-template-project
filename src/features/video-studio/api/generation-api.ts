import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { AspectRatio, JobErrorCode } from '@/domain/video';

/**
 * API tạo video THẬT qua Veo (P3): submit → poll. Backend dùng API key của chính
 * user (đã mã hoá) để gọi Veo; ở đây chỉ biết URL endpoint (rule §5). Lỗi provider
 * (vd key sai) trả về như KẾT QUẢ JOB (`error`), không phải lỗi HTTP.
 */

export interface GenerateBody {
  sceneId?: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
}

/** Lỗi job từ backend — có thêm `message` gốc của provider (để hiển thị chi tiết). */
export interface GenJobError {
  code: JobErrorCode;
  retriable: boolean;
  message?: string;
}

export interface SubmitResult {
  operationName?: string;
  error?: GenJobError;
}

/** Body tạo ẢNH (đồng bộ) — provider ảnh (không có duration). */
export interface GenerateImageBody {
  sceneId?: string;
  prompt: string;
  model: string;
  aspectRatio: AspectRatio;
}

/** Kết quả tạo ảnh: hoặc ảnh base64, hoặc lỗi job (HTTP 200). */
export interface ImageResult {
  image?: { mimeType: string; dataBase64: string };
  error?: GenJobError;
}

export interface PollResult {
  status: 'processing' | 'success' | 'error';
  videoUri?: string;
  error?: GenJobError;
}

export const generationApi = {
  submit: async (projectId: string, body: GenerateBody): Promise<SubmitResult> => {
    const { data } = await apiClient.post<ApiEnvelope<SubmitResult>>(
      `/video-projects/${projectId}/generate`,
      body,
    );
    return data.data;
  },
  /** Tạo ẢNH đồng bộ (provider ảnh) — trả ảnh base64 hoặc lỗi job, KHÔNG poll. */
  generateImage: async (projectId: string, body: GenerateImageBody): Promise<ImageResult> => {
    const { data } = await apiClient.post<ApiEnvelope<ImageResult>>(
      `/video-projects/${projectId}/generate-image`,
      body,
    );
    return data.data;
  },
  poll: async (projectId: string, op: string): Promise<PollResult> => {
    const { data } = await apiClient.get<ApiEnvelope<PollResult>>(
      `/video-projects/${projectId}/generation`,
      { params: { op } },
    );
    return data.data;
  },
  /**
   * Tải BYTE video của một operation đã xong. Server (giữ key) chuyền thẳng từ Veo
   * (spec §12); ở đây nhận Blob để FE ghi vào thư mục user chọn. Không phải envelope
   * JSON — nên đọc `blob` trực tiếp.
   */
  download: async (projectId: string, op: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/video-projects/${projectId}/download`, {
      params: { op },
      responseType: 'blob',
    });
    return data;
  },
};
