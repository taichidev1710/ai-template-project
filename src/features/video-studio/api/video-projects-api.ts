import { apiClient } from '@/shared/api';
import type { ApiEnvelope } from '@/shared/api';
import type { AspectRatio, AssetKind, JobError, JobStatus, RunConfig } from '@/domain/video';

/** A terminal job persisted with its scene (spec §12.1: job status + file ref). */
export interface PersistedJob {
  index: number;
  status: JobStatus;
  attempts: number;
  outputPath?: string;
  error?: JobError;
}

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
  /** Assets assigned to this scene (settings/styles applied to a group). */
  assetIds?: string[];
  /** Terminal job results (success/error) so generated videos survive reopen. */
  jobs?: PersistedJob[];
}

/** An asset as persisted (no image bytes — object storage is a later step). Field
 * collection name stays `characters` for compat; items are assets of any kind. */
export interface PersistedCharacter {
  id: string;
  /** Optional for legacy projects saved before kinds existed → treat as character. */
  kind?: AssetKind;
  key: string;
  displayName: string;
  color: string;
  /** Text description / reusable prompt block (style-by-text, level-3 sync). */
  description?: string;
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
