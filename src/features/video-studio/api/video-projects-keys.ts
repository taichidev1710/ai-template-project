import type { VideoProjectsListParams } from './video-projects-api';

/** Query key factory — consistent cache keys + precise invalidation. */
export const videoProjectsKeys = {
  all: ['video-projects'] as const,
  lists: () => [...videoProjectsKeys.all, 'list'] as const,
  list: (params: VideoProjectsListParams) => [...videoProjectsKeys.lists(), params] as const,
  details: () => [...videoProjectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoProjectsKeys.details(), id] as const,
};
