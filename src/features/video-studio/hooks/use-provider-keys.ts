import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { providerKeysApi, type KeyProvider } from '../api/provider-keys-api';
import { providerKeysKeys } from '../api/provider-keys-keys';

/** Danh sách key đã cấu hình của chính user. Server state → TanStack Query. */
export function useProviderKeys() {
  return useQuery({
    queryKey: providerKeysKeys.list(),
    queryFn: () => providerKeysApi.list(),
  });
}

/** Lưu / xoá key của chính user, kèm toast + invalidate cache. */
export function useProviderKeyMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation('video-studio');

  const invalidate = () => qc.invalidateQueries({ queryKey: providerKeysKeys.all });
  const onError = (e: NormalizedError) => message.error(e.message);

  const save = useMutation({
    mutationFn: ({ provider, fields }: { provider: KeyProvider; fields: Record<string, string> }) =>
      providerKeysApi.set(provider, fields),
    onSuccess: () => {
      void invalidate();
      message.success(t('apiKey.saved'));
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (provider: KeyProvider) => providerKeysApi.remove(provider),
    onSuccess: () => {
      void invalidate();
      message.success(t('apiKey.removed'));
    },
    onError,
  });

  return { save, remove };
}
