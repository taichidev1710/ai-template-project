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

/** Every type, unpaginated — for pickers (e.g. a diagram choosing its type). */
export function useAllDiagramTypes() {
  return useQuery({
    queryKey: diagramTypesKeys.options(),
    queryFn: () => diagramTypesApi.listAll(),
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

  // Covers lists, the picker's `options`, and details in one shot.
  const invalidate = () => qc.invalidateQueries({ queryKey: diagramTypesKeys.all });
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
    onSuccess: () => {
      void invalidate();
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
