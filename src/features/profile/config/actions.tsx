import {
  EditOutlined,
  RiseOutlined,
  MessageOutlined,
  GiftOutlined,
  UserSwitchOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { atLeast } from './conditions';
import type { ActionRule, ProfileAction, ProfileActionKey, ProfileContext } from '../types';

/**
 * ACTION RULES — the capability layer.
 *
 * Each action declares WHEN it is visible (and optionally when disabled) as a
 * predicate over the full context, so a single list expresses combinations of
 * tier ∧ status ∧ surface ∧ permission without a combinatorial map.
 */
export const ACTION_RULES: ActionRule[] = [
  {
    key: 'edit',
    label: 'action.edit',
    icon: <EditOutlined />,
    type: 'default',
    when: (c) => c.can?.('profile.edit') ?? true,
  },
  {
    key: 'upgrade',
    label: 'profile.action.upgrade',
    icon: <RiseOutlined />,
    type: 'primary',
    when: (c) => c.profile.tier !== 'vip' && c.status === 'active',
  },
  {
    key: 'message',
    label: 'profile.action.message',
    icon: <MessageOutlined />,
    when: (c) => atLeast('intermediate')(c) && c.status === 'active',
  },
  {
    key: 'assignManager',
    label: 'profile.action.assignManager',
    icon: <UserSwitchOutlined />,
    when: atLeast('advanced'),
  },
  {
    key: 'viewPerks',
    label: 'profile.action.viewPerks',
    icon: <GiftOutlined />,
    when: atLeast('advanced'),
  },
  {
    key: 'callHotline',
    label: 'profile.action.callHotline',
    icon: <PhoneOutlined />,
    when: atLeast('vip'),
  },
  {
    key: 'adjustCredit',
    label: 'profile.action.adjustCredit',
    icon: <CreditCardOutlined />,
    when: atLeast('vip'),
    disabledWhen: (c) => c.status !== 'active', // visible for VIP, but locked unless active
  },
  {
    key: 'reactivate',
    label: 'profile.action.reactivate',
    icon: <ReloadOutlined />,
    type: 'primary',
    danger: true,
    when: (c) => c.status === 'suspended', // only appears for suspended accounts
  },
];

const BY_KEY = new Map<string, ActionRule>(ACTION_RULES.map((rule) => [rule.key, rule]));

function toResolved(rule: ActionRule, ctx: ProfileContext): ProfileAction {
  return {
    key: rule.key,
    label: rule.label,
    icon: rule.icon,
    type: rule.type,
    danger: rule.danger,
    disabled: rule.disabledWhen?.(ctx) ?? false,
  };
}

/** Default set: every rule whose `when` passes, in declaration order. */
export function resolveActions(ctx: ProfileContext): ProfileAction[] {
  return ACTION_RULES.filter((rule) => rule.when?.(ctx) ?? true).map((rule) => toResolved(rule, ctx));
}

/**
 * Consumer override: force an exact key set (bypasses `when`, since the caller
 * asked for them explicitly) while still honouring `disabledWhen`.
 */
export function resolveActionKeys(
  keys: Array<ProfileActionKey | string>,
  ctx: ProfileContext,
): ProfileAction[] {
  return keys.flatMap((key) => {
    const rule = BY_KEY.get(key);
    return rule ? [toResolved(rule, ctx)] : [];
  });
}
