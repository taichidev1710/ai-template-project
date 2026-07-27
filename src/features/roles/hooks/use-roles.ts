import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { rolesApi } from '../api/roles-api';
import type { RoleInput, RolesListParams } from '../types';

const keys = {
  all: ['roles'] as const,
  list: (params: RolesListParams) => [...keys.all, 'list', params] as const,
};

export function useRoles(params: RolesListParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => rolesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useRoleMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: keys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: RoleInput) => rolesApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RoleInput> }) =>
      rolesApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
