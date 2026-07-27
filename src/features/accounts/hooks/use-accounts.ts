import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { accountsApi } from '../api/accounts-api';
import { accountsKeys } from '../api/accounts-keys';
import type { PendingListParams } from '../types';

export function usePendingAccounts(params: PendingListParams) {
  return useQuery({
    queryKey: accountsKeys.pending(params),
    queryFn: () => accountsApi.listPending(params),
    placeholderData: keepPreviousData,
  });
}

export function useApprovalHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: accountsKeys.history(id),
    queryFn: () => accountsApi.history(id),
    enabled: enabled && Boolean(id),
  });
}

export function useAccountDecisions() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: accountsKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const approve = useMutation({
    mutationFn: (id: string) => accountsApi.approve(id),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.approve'));
    },
    onError,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => accountsApi.reject(id, reason),
    onSuccess: () => {
      void invalidate();
      message.success(t('action.reject'));
    },
    onError,
  });

  return { approve, reject };
}
