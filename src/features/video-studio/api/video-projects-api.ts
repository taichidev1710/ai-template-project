import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { AspectRatio, RunConfig } from '@/domain/video';

/**
 * API layer for Video Studio projects — the ONLY place that knows these URLs
 * (rule §5). The backend `video-project` module persists a project per user; the
 * server does NOT store character image bytes or runtime jobs, so the persisted
 * shapes below are lighter than the in-app draft.
 */

/** A scene as persisted by the backend (no jobs, no derived characterKeys). */
export interface PersistedScene {
  id: string;
  order: number;
  text: string;
  aspectOverride?: AspectRatio;
  countOverride?: number;
}

/** A character as persisted (no image bytes — object storage is a later step). */
export interface PersistedCharacter {
  id: string;
  key: string;
  displayName: string;
  color: string;
}

export interface VideoProjectDto {
  id: string;
  ownerId: string;
  name: string;
  sourcePrompt: string;
  runConfig: RunConfig;
  scenes: PersistedScene[];
  characters: PersistedCharacter[];
  createdAt: string;
  updatedAt: string;
}

/** What create/update send (server derives id/owner/timestamps). */
export interface VideoProjectInput {
  name: string;
  sourcePrompt: string;
  runConfig: RunConfig;
  scenes: PersistedScene[];
  characters: PersistedCharacter[];
}

export interface VideoProjectsListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'name' | '-name' | 'createdAt' | '-createdAt' | 'updatedAt' | '-updatedAt';
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const videoProjectsApi = {
  list: async (
    params: VideoProjectsListParams = {},
  ): Promise<{ items: VideoProjectDto[]; total: number }> => {
    const { data } = await apiClient.get<ApiEnvelope<VideoProjectDto[]> & { meta: ListMeta }>(
      '/video-projects',
      { params },
    );
    return { items: data.data, total: data.meta?.total ?? data.data.length };
  },
  get: async (id: string): Promise<VideoProjectDto> => {
    const { data } = await apiClient.get<ApiEnvelope<VideoProjectDto>>(`/video-projects/${id}`);
    return data.data;
  },
  create: async (input: VideoProjectInput): Promise<VideoProjectDto> => {
    const { data } = await apiClient.post<ApiEnvelope<VideoProjectDto>>('/video-projects', input);
    return data.data;
  },
  update: async (id: string, input: Partial<VideoProjectInput>): Promise<VideoProjectDto> => {
    const { data } = await apiClient.patch<ApiEnvelope<VideoProjectDto>>(
      `/video-projects/${id}`,
      input,
    );
    return data.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/video-projects/${id}`);
  },
};
