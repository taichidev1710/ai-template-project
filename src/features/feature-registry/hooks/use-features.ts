import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { featureRegistryApi } from '../api/feature-registry-api';
import type { FeatureInput, FeatureListParams } from '../types';

const keys = {
  all: ['features'] as const,
  list: (params: FeatureListParams) => [...keys.all, 'list', params] as const,
};

export function useFeatures(params: FeatureListParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => featureRegistryApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useFeatureMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: keys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: FeatureInput) => featureRegistryApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FeatureInput> }) =>
      featureRegistryApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => featureRegistryApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
