import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { memberGroupsApi } from '../api/member-groups-api';
import { memberGroupsKeys } from '../api/member-groups-keys';
import type { MemberGroupInput, MemberGroupListParams } from '../types';

export function useMemberGroups(params: MemberGroupListParams) {
  return useQuery({
    queryKey: memberGroupsKeys.list(params),
    queryFn: () => memberGroupsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMemberGroupMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: memberGroupsKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: MemberGroupInput) => memberGroupsApi.create(input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberGroupInput> }) =>
      memberGroupsApi.update(id, input),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.save'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => memberGroupsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  return { create, update, remove };
}
