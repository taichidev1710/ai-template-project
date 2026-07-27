import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { permissionGroupsApi } from '../api/permission-groups-api';
import { permissionGroupsKeys } from '../api/permission-groups-keys';
import type { GroupListParams, PermissionGroupInput } from '../types';

export function usePermissionGroups(params: GroupListParams) {
  return useQuery({
    queryKey: permissionGroupsKeys.list(params),
    queryFn: () => permissionGroupsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePermissionGroupMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: permissionGroupsKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: PermissionGroupInput) => permissionGroupsApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PermissionGroupInput> }) =>
      permissionGroupsApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => permissionGroupsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
