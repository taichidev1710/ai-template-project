import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { videoProjectsApi, type VideoProjectInput, type VideoProjectsListParams } from '../api/video-projects-api';
import { videoProjectsKeys } from '../api/video-projects-keys';

/** Saved projects list. Server state → TanStack Query (per state-management rules). */
export function useVideoProjects(params: VideoProjectsListParams = {}) {
  return useQuery({
    queryKey: videoProjectsKeys.list(params),
    queryFn: () => videoProjectsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Create / update / delete a project, with toasts + cache invalidation. */
export function useVideoProjectMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('video-studio');

  const invalidate = () => qc.invalidateQueries({ queryKey: videoProjectsKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message);

  const create = useMutation({
    mutationFn: (input: VideoProjectInput) => videoProjectsApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('project.saved'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VideoProjectInput> }) =>
      videoProjectsApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('project.saved'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => videoProjectsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('project.deleted'));
    },
    onError,
  });

  return { create, update, remove };
}
