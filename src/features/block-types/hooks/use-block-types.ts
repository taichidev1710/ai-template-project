import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { blockTypesApi } from '../api/block-types-api';
import { blockTypesKeys } from '../api/block-types-keys';
import type { BlockTypeInput, BlockTypesListParams } from '../types';

/** Read list scoped to a Loại sơ đồ. Server state → TanStack Query. */
export function useBlockTypes(typeId: string, params: BlockTypesListParams) {
  return useQuery({
    queryKey: blockTypesKeys.list(typeId, params),
    queryFn: () => blockTypesApi.list(typeId, params),
    placeholderData: keepPreviousData,
  });
}

/** Create + update + delete within a Loại sơ đồ, with toasts + invalidation. */
export function useBlockTypeMutations(typeId: string) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: blockTypesKeys.lists(typeId) });
    // Refresh the parent Loại sơ đồ so the editor's tab count stays accurate.
    void qc.invalidateQueries({ queryKey: ['diagram-types'] });
  };
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: BlockTypeInput) => blockTypesApi.create(typeId, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: BlockTypeInput }) => blockTypesApi.update(typeId, id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => blockTypesApi.remove(typeId, id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
