import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import type { UserStatus } from '@/shared/stores/auth-store';
import { usersApi } from '../api/users-api';
import { usersKeys } from '../api/users-keys';
import type { UserInput, UsersListParams } from '../types';

/** Read list. Server state → TanStack Query (per state-management rules). */
export function useUsers(params: UsersListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** All user mutations, with toasts + cache invalidation. */
export function useUserMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: usersKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));
  const saved = () => {
    void invalidate();
    message.success(t('action.save'));
  };

  const create = useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: saved,
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.delete'));
    },
    onError,
  });

  const assignRoles = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: saved,
    onError,
  });

  const assignGroups = useMutation({
    mutationFn: ({ id, groupIds }: { id: string; groupIds: string[] }) =>
      usersApi.assignGroups(id, groupIds),
    onSuccess: saved,
    onError,
  });

  const setExtraPermissions = useMutation({
    mutationFn: ({ id, grants }: { id: string; grants: string[] }) =>
      usersApi.setExtraPermissions(id, grants),
    onSuccess: saved,
    onError,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Extract<UserStatus, 'active' | 'disabled'> }) =>
      usersApi.setStatus(id, status),
    onSuccess: saved,
    onError,
  });

  const reassignManager = useMutation({
    mutationFn: ({ id, managerId }: { id: string; managerId: string | null }) =>
      usersApi.reassignManager(id, managerId),
    onSuccess: saved,
    onError,
  });

  return {
    create,
    remove,
    assignRoles,
    assignGroups,
    setExtraPermissions,
    setStatus,
    reassignManager,
  };
}
