import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { profileApi } from '../api/profile-api';
import { profileKeys } from '../api/profile-keys';
import type { ProfileInput, ProfileListParams } from '../types';

/** Read list. Server state → TanStack Query (per state-management rules). */
export function useProfiles(params: ProfileListParams) {
  return useQuery({
    queryKey: profileKeys.list(params),
    queryFn: () => profileApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProfile(id: string, enabled = true) {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => profileApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

/** Create + update + delete, with toasts and cache invalidation. */
export function useProfileMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: profileKeys.lists() });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: ProfileInput) => profileApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfileInput }) => profileApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => profileApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
