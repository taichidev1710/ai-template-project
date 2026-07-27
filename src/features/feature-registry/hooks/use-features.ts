import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { featureRegistryApi } from '../api/feature-registry-api';
import { featuresKeys } from '../api/feature-registry-keys';
import type { FeatureInput, FeatureListParams } from '../types';

export function useFeatures(params: FeatureListParams) {
  return useQuery({
    queryKey: featuresKeys.list(params),
    queryFn: () => featureRegistryApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useFeatureMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: featuresKeys.all });
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
