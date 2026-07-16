import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import type { NormalizedError } from '@/shared/api';
import { ruleSetsApi } from '../api/rule-sets-api';
import { ruleSetsKeys } from '../api/rule-sets-keys';
import type { RuleSetInput, RuleInput } from '../types';

export function useRuleSets(typeId: string) {
  return useQuery({
    queryKey: ruleSetsKeys.list(typeId),
    queryFn: () => ruleSetsApi.list(typeId),
  });
}

/** All rule-set + rule mutations for a Loại sơ đồ, with toasts + invalidation. */
export function useRuleSetMutations(typeId: string) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ruleSetsKeys.list(typeId) });
    // Refresh the parent Loại sơ đồ so the editor's tab count stays accurate.
    void qc.invalidateQueries({ queryKey: ['diagram-types'] });
  };
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));
  const ok = (msg: string) => () => {
    invalidate();
    message.success(msg);
  };

  const createSet = useMutation({ mutationFn: (input: RuleSetInput) => ruleSetsApi.createSet(typeId, input), onSuccess: ok(t('action.save')), onError });
  const updateSet = useMutation({ mutationFn: (v: { id: string; input: RuleSetInput }) => ruleSetsApi.updateSet(typeId, v.id, v.input), onSuccess: ok(t('action.save')), onError });
  const removeSet = useMutation({ mutationFn: (id: string) => ruleSetsApi.removeSet(typeId, id), onSuccess: ok(t('action.delete')), onError });

  const addRule = useMutation({ mutationFn: (v: { setId: string; input: RuleInput }) => ruleSetsApi.addRule(typeId, v.setId, v.input), onSuccess: ok(t('action.save')), onError });
  const updateRule = useMutation({ mutationFn: (v: { setId: string; ruleId: string; input: RuleInput }) => ruleSetsApi.updateRule(typeId, v.setId, v.ruleId, v.input), onSuccess: ok(t('action.save')), onError });
  const removeRule = useMutation({ mutationFn: (v: { setId: string; ruleId: string }) => ruleSetsApi.removeRule(typeId, v.setId, v.ruleId), onSuccess: ok(t('action.delete')), onError });

  return { createSet, updateSet, removeSet, addRule, updateRule, removeRule };
}
