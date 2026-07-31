import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { providerRegistryApi } from '../api/provider-registry-api';
import { providersKeys } from '../api/provider-registry-keys';
import type { ProviderInput, ProviderListParams } from '../types';

export function useProviders(params: ProviderListParams) {
  return useQuery({
    queryKey: providersKeys.list(params),
    queryFn: () => providerRegistryApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useProviderMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: providersKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: ProviderInput) => providerRegistryApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProviderInput> }) =>
      providerRegistryApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => providerRegistryApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
