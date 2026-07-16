import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { blockTypesApi } from '../api/block-types-api';
import { blockTypesKeys } from '../api/block-types-keys';
import type { BlockTypeInput, BlockTypesListParams } from '../types';

/** Read list. Server state → TanStack Query. */
export function useBlockTypes(params: BlockTypesListParams) {
  return useQuery({
    queryKey: blockTypesKeys.list(params),
    queryFn: () => blockTypesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** Create + update + delete, with toasts and cache invalidation. */
export function useBlockTypeMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: blockTypesKeys.lists() });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: BlockTypeInput) => blockTypesApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BlockTypeInput }) => blockTypesApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => blockTypesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
