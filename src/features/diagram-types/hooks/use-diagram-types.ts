import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { diagramTypesApi } from '../api/diagram-types-api';
import { diagramTypesKeys } from '../api/diagram-types-keys';
import type { DiagramTypeInput, DiagramTypesListParams } from '../types';

export function useDiagramTypes(params: DiagramTypesListParams) {
  return useQuery({
    queryKey: diagramTypesKeys.list(params),
    queryFn: () => diagramTypesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDiagramType(id: string, enabled = true) {
  return useQuery({
    queryKey: diagramTypesKeys.detail(id),
    queryFn: () => diagramTypesApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

export function useDiagramTypeMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: diagramTypesKeys.lists() });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: DiagramTypeInput) => diagramTypesApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DiagramTypeInput }) => diagramTypesApi.update(id, input),
    onSuccess: (updated) => {
      void invalidate();
      void qc.invalidateQueries({ queryKey: diagramTypesKeys.detail(updated.id) });
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => diagramTypesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
