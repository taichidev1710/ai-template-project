import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { diagramsApi } from '../api/diagrams-api';
import { diagramsKeys } from '../api/diagrams-keys';
import type { DiagramContentInput, DiagramCreateInput, DiagramInput, DiagramsListParams } from '../types';

/** Read list. Server state → TanStack Query. */
export function useDiagrams(params: DiagramsListParams) {
  return useQuery({
    queryKey: diagramsKeys.list(params),
    queryFn: () => diagramsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDiagram(id: string, enabled = true) {
  return useQuery({
    queryKey: diagramsKeys.detail(id),
    queryFn: () => diagramsApi.get(id),
    enabled: enabled && Boolean(id),
  });
}

/** Create + update + delete, with toasts + invalidation. */
export function useDiagramMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: diagramsKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: DiagramCreateInput) => diagramsApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DiagramInput }) => diagramsApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => diagramsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}

/** Save what the canvas owns (nodes/edges/visibility/local rules). */
export function useDiagramContentMutation(id: string) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (content: DiagramContentInput) => diagramsApi.saveContent(id, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: diagramsKeys.all });
      message.success(t('action.save'));
    },
    onError: (e: NormalizedError) => message.error(e.message || t('error.generic')),
  });
}
