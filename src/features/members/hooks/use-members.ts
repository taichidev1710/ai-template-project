import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import type { UserStatus } from '@/shared/stores/auth-store';
import { membersApi } from '../api/members-api';
import { membersKeys } from '../api/members-keys';
import type { MemberListParams } from '../types';

export function useMembers(params: MemberListParams) {
  return useQuery({
    queryKey: membersKeys.list(params),
    queryFn: () => membersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useMemberMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: membersKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));
  const onSaved = () => {
    void invalidate();
    message.success(t('action.save'));
  };

  const approve = useMutation({
    mutationFn: (id: string) => membersApi.approve(id),
    onSuccess: onSaved,
    onError,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => membersApi.reject(id, reason),
    onSuccess: onSaved,
    onError,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Extract<UserStatus, 'active' | 'disabled'> }) =>
      membersApi.setStatus(id, status),
    onSuccess: onSaved,
    onError,
  });

  const reassignTier = useMutation({
    mutationFn: ({ id, tierId }: { id: string; tierId: string | null }) =>
      membersApi.reassignTier(id, tierId),
    onSuccess: onSaved,
    onError,
  });

  const setMemberGroups = useMutation({
    mutationFn: ({ id, groupIds }: { id: string; groupIds: string[] }) =>
      membersApi.setMemberGroups(id, groupIds),
    onSuccess: onSaved,
    onError,
  });

  return { approve, reject, setStatus, reassignTier, setMemberGroups };
}
