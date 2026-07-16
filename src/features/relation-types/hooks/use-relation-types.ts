import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { relationTypesApi } from '../api/relation-types-api';
import { relationTypesKeys } from '../api/relation-types-keys';
import type { RelationInput, RelationsListParams } from '../types';

export function useRelations(typeId: string, params: RelationsListParams) {
  return useQuery({
    queryKey: relationTypesKeys.list(typeId, params),
    queryFn: () => relationTypesApi.list(typeId, params),
    placeholderData: keepPreviousData,
  });
}

/** All relations of a type — for the derived "over" select. */
export function useAllRelations(typeId: string) {
  return useQuery({
    queryKey: relationTypesKeys.allItems(typeId),
    queryFn: () => relationTypesApi.listAll(typeId),
  });
}

export function useRelationMutations(typeId: string) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: relationTypesKeys.lists(typeId) });
    void qc.invalidateQueries({ queryKey: relationTypesKeys.allItems(typeId) });
    // Refresh the parent Loại sơ đồ so the editor's tab count stays accurate.
    void qc.invalidateQueries({ queryKey: ['diagram-types'] });
  };
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: RelationInput) => relationTypesApi.create(typeId, input),
    onSuccess: () => {
      invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RelationInput }) => relationTypesApi.update(typeId, id, input),
    onSuccess: () => {
      invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => relationTypesApi.remove(typeId, id),
    onSuccess: () => {
      invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
