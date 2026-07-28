import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { memberFeaturesApi } from '../api/member-features-api';
import { memberFeaturesKeys } from '../api/member-features-keys';
import type { MemberFeatureInput, MemberFeatureListParams } from '../types';

export function useMemberFeatures(params: MemberFeatureListParams) {
  return useQuery({
    queryKey: memberFeaturesKeys.list(params),
    queryFn: () => memberFeaturesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMemberFeatureMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: memberFeaturesKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: MemberFeatureInput) => memberFeaturesApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberFeatureInput> }) =>
      memberFeaturesApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => memberFeaturesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
